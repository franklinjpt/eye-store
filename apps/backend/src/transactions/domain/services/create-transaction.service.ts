import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CHECKOUT_FEES_CENTS } from '@eye-store/shared';
import {
  CreateTransactionCommand,
  CreateTransactionUseCase,
} from '../ports/inbound/create-transaction.use-case';
import { TransactionRepositoryPort } from '../ports/outbound/transaction-repository.port';
import { PaymentGatewayPort } from '../ports/outbound/payment-gateway.port';
import { ProductRepositoryPort } from '../../../products/domain/ports/outbound/product-repository.port';
import { Product } from '../../../products/domain/models/product';
import { Transaction } from '../models/transaction';
import { TransactionStatus } from '../models/transaction-status.enum';
import {
  TRANSACTION_REPOSITORY_PORT,
  PAYMENT_GATEWAY_PORT,
} from '../../transactions.tokens';
import { PRODUCT_REPOSITORY_PORT } from '../../../products/products.tokens';
import { flatMapAsync, ok, Result, err } from '../../../common/result';
import {
  outOfStockFailure,
  paymentGatewayFailure,
  productNotFoundFailure,
  stockUpdateFailedFailure,
  TransactionFailure,
  transactionNotFoundFailure,
  transactionPersistenceFailure,
} from '../errors/transaction.failure';
import { WompiStatusMapper } from '../mappers/wompi-status.mapper';

const { base: BASE_FEE_CENTS, delivery: DELIVERY_FEE_CENTS } =
  CHECKOUT_FEES_CENTS;

type PreparedTransaction = {
  product: Product;
  totalAmountCents: number;
  reference: string;
};

type PendingTransactionContext = {
  pendingTransaction: Transaction;
  totalAmountCents: number;
  reference: string;
};

type ProcessedPaymentContext = {
  pendingTransaction: Transaction;
  mappedStatus: TransactionStatus;
  wompiTransactionId: string;
};

type FinalizedTransactionContext = {
  transaction: Transaction;
  shouldDecrementStock: boolean;
};

@Injectable()
export class CreateTransactionService implements CreateTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY_PORT)
    private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(PAYMENT_GATEWAY_PORT)
    private readonly paymentGateway: PaymentGatewayPort,
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepository: ProductRepositoryPort,
  ) {}

  async execute(
    command: CreateTransactionCommand,
  ): Promise<Result<Transaction, TransactionFailure>> {
    return flatMapAsync(
      flatMapAsync(
        flatMapAsync(
          flatMapAsync(
            this.validateAndPrepare(command),
            (prepared) => this.createPendingTransaction(prepared, command),
          ),
          (pendingContext) => this.processPayment(pendingContext, command),
        ),
        (processedPayment) => this.finalizeTransaction(processedPayment),
      ),
      (finalizedContext) => this.decrementStockIfApproved(finalizedContext),
    );
  }

  private async validateAndPrepare(
    command: CreateTransactionCommand,
  ): Promise<Result<PreparedTransaction, TransactionFailure>> {
    const product = await this.productRepository.findById(command.productId);
    if (!product) {
      return err(productNotFoundFailure(command.productId));
    }
    if (product.stock <= 0) {
      return err(outOfStockFailure(command.productId));
    }

    // Wompi CARD payments require whole pesos — round to nearest peso before converting to cents
    const productPriceCents = Math.round(product.price) * 100;
    const totalAmountCents =
      productPriceCents + BASE_FEE_CENTS + DELIVERY_FEE_CENTS;

    // Generate unique reference
    const reference = `EYE-${randomUUID().slice(0, 8).toUpperCase()}`;

    return ok({
      product,
      totalAmountCents,
      reference,
    });
  }

  private async createPendingTransaction(
    prepared: PreparedTransaction,
    command: CreateTransactionCommand,
  ): Promise<Result<PendingTransactionContext, TransactionFailure>> {
    // Create PENDING transaction in DB
    try {
      const pendingTransaction = await this.transactionRepository.save({
        productId: prepared.product.id,
        amountInCents: prepared.totalAmountCents,
        currency: 'COP',
        status: TransactionStatus.PENDING,
        wompiTransactionId: null,
        reference: prepared.reference,
        customerName: command.customerName,
        customerEmail: command.customerEmail,
        deliveryAddress: command.deliveryAddress,
        deliveryCity: command.deliveryCity,
        customerPhone: command.customerPhone,
      });

      return ok({
        pendingTransaction,
        totalAmountCents: prepared.totalAmountCents,
        reference: prepared.reference,
      });
    } catch {
      return err(transactionPersistenceFailure('create pending transaction'));
    }
  }

  private async processPayment(
    pendingContext: PendingTransactionContext,
    command: CreateTransactionCommand,
  ): Promise<Result<ProcessedPaymentContext, TransactionFailure>> {
    // Call WOMPI via PaymentGatewayPort
    try {
      const paymentResponse = await this.paymentGateway.createPayment({
        amountInCents: pendingContext.totalAmountCents,
        currency: 'COP',
        reference: pendingContext.reference,
        customerEmail: command.customerEmail,
        paymentMethodToken: command.tokenId,
        acceptanceToken: command.acceptanceToken,
        installments: 1,
      });

      return ok({
        pendingTransaction: pendingContext.pendingTransaction,
        mappedStatus: WompiStatusMapper.toDomain(paymentResponse.status),
        wompiTransactionId: paymentResponse.transactionId,
      });
    } catch {
      try {
        await this.transactionRepository.updateStatus(
          pendingContext.pendingTransaction.id,
          TransactionStatus.ERROR,
        );
      } catch {
        return err(
          transactionPersistenceFailure('mark transaction as payment error'),
        );
      }

      return err(paymentGatewayFailure());
    }
  }

  private async finalizeTransaction(
    processedPayment: ProcessedPaymentContext,
  ): Promise<Result<FinalizedTransactionContext, TransactionFailure>> {
    // Update transaction only while it is still PENDING to avoid double stock decrements
    try {
      const updatedTransaction =
        await this.transactionRepository.updateStatusFromPending(
          processedPayment.pendingTransaction.id,
          processedPayment.mappedStatus,
          processedPayment.wompiTransactionId,
        );

      if (updatedTransaction) {
        return ok({
          transaction: updatedTransaction,
          shouldDecrementStock:
            processedPayment.mappedStatus === TransactionStatus.APPROVED,
        });
      }

      const currentTransaction = await this.transactionRepository.findById(
        processedPayment.pendingTransaction.id,
      );
      if (!currentTransaction) {
        return err(
          transactionNotFoundFailure(processedPayment.pendingTransaction.id),
        );
      }

      return ok({
        transaction: currentTransaction,
        shouldDecrementStock: false,
      });
    } catch {
      return err(transactionPersistenceFailure('update transaction status'));
    }
  }

  private async decrementStockIfApproved(
    finalizedContext: FinalizedTransactionContext,
  ): Promise<Result<Transaction, TransactionFailure>> {
    if (!finalizedContext.shouldDecrementStock) {
      return ok(finalizedContext.transaction);
    }

    try {
      await this.productRepository.decrementStock(
        finalizedContext.transaction.productId,
        1,
      );
      return ok(finalizedContext.transaction);
    } catch {
      return err(stockUpdateFailedFailure(finalizedContext.transaction.productId));
    }
  }
}
