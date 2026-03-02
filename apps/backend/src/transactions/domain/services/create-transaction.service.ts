import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateTransactionUseCase, CreateTransactionCommand } from '../ports/inbound/create-transaction.use-case';
import { TransactionRepositoryPort } from '../ports/outbound/transaction-repository.port';
import { PaymentGatewayPort } from '../ports/outbound/payment-gateway.port';
import { ProductRepositoryPort } from '../../../products/domain/ports/outbound/product-repository.port';
import { Transaction } from '../models/transaction';
import { TransactionStatus } from '../models/transaction-status.enum';
import {
  TRANSACTION_REPOSITORY_PORT,
  PAYMENT_GATEWAY_PORT,
} from '../../transactions.tokens';
import { PRODUCT_REPOSITORY_PORT } from '../../../products/products.tokens';

const BASE_FEE_CENTS = 200000; // $2,000 COP
const DELIVERY_FEE_CENTS = 500000; // $5,000 COP

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

  async execute(command: CreateTransactionCommand): Promise<Transaction> {
    // Validate product exists and has stock
    const product = await this.productRepository.findById(command.productId);
    if (!product) {
      throw new NotFoundException(`Product with id "${command.productId}" not found`);
    }
    if (product.stock <= 0) {
      throw new Error('Product is out of stock');
    }

    // Calculate total: product price (convert to cents) + base fee + delivery fee
    const productPriceCents = Math.round(product.price * 100);
    const totalAmountCents = productPriceCents + BASE_FEE_CENTS + DELIVERY_FEE_CENTS;

    // Generate unique reference
    const reference = `EYE-${randomUUID().slice(0, 8).toUpperCase()}`;

    // Create PENDING transaction in DB
    const pendingTransaction = await this.transactionRepository.save({
      productId: command.productId,
      amountInCents: totalAmountCents,
      currency: 'COP',
      status: TransactionStatus.PENDING,
      wompiTransactionId: null,
      reference,
      customerName: command.customerName,
      customerEmail: command.customerEmail,
      deliveryAddress: command.deliveryAddress,
      deliveryCity: command.deliveryCity,
      customerPhone: command.customerPhone,
    });

    // Call WOMPI via PaymentGatewayPort
    let paymentResponse;
    try {
      paymentResponse = await this.paymentGateway.createPayment({
        amountInCents: totalAmountCents,
        currency: 'COP',
        reference,
        customerEmail: command.customerEmail,
        paymentMethodToken: command.tokenId,
        acceptanceToken: command.acceptanceToken,
        installments: 1,
      });
    } catch {
      await this.transactionRepository.updateStatus(
        pendingTransaction.id,
        TransactionStatus.ERROR,
      );
      throw new Error('Payment gateway error');
    }

    // Map WOMPI status to our TransactionStatus
    const statusMap: Record<string, TransactionStatus> = {
      APPROVED: TransactionStatus.APPROVED,
      DECLINED: TransactionStatus.DECLINED,
      VOIDED: TransactionStatus.VOIDED,
      ERROR: TransactionStatus.ERROR,
      PENDING: TransactionStatus.PENDING,
    };
    const mappedStatus = statusMap[paymentResponse.status] ?? TransactionStatus.ERROR;

    // Update transaction with result
    const updatedTransaction = await this.transactionRepository.updateStatus(
      pendingTransaction.id,
      mappedStatus,
      paymentResponse.transactionId,
    );

    // If APPROVED, decrement stock
    if (mappedStatus === TransactionStatus.APPROVED) {
      await this.productRepository.decrementStock(command.productId, 1);
    }

    return updatedTransaction;
  }
}
