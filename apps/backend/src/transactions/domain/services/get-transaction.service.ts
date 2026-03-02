import { Injectable, Inject, Logger } from '@nestjs/common';
import { GetTransactionUseCase } from '../ports/inbound/get-transaction.use-case';
import { TransactionRepositoryPort } from '../ports/outbound/transaction-repository.port';
import { PaymentGatewayPort } from '../ports/outbound/payment-gateway.port';
import { Transaction } from '../models/transaction';
import { TransactionStatus } from '../models/transaction-status.enum';
import {
  TRANSACTION_REPOSITORY_PORT,
  PAYMENT_GATEWAY_PORT,
} from '../../transactions.tokens';
import { ProductRepositoryPort } from '../../../products/domain/ports/outbound/product-repository.port';
import { PRODUCT_REPOSITORY_PORT } from '../../../products/products.tokens';
import { err, ok, Result } from '../../../common/result';
import {
  stockUpdateFailedFailure,
  TransactionFailure,
  transactionNotFoundFailure,
  transactionPersistenceFailure,
} from '../errors/transaction.failure';
import { WompiStatusMapper } from '../mappers/wompi-status.mapper';

const FINAL_STATUSES = new Set([
  TransactionStatus.APPROVED,
  TransactionStatus.DECLINED,
  TransactionStatus.VOIDED,
  TransactionStatus.ERROR,
]);

@Injectable()
export class GetTransactionService implements GetTransactionUseCase {
  private readonly logger = new Logger(GetTransactionService.name);

  constructor(
    @Inject(TRANSACTION_REPOSITORY_PORT)
    private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(PAYMENT_GATEWAY_PORT)
    private readonly paymentGateway: PaymentGatewayPort,
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepository: ProductRepositoryPort,
  ) {}

  async execute(id: string): Promise<Result<Transaction, TransactionFailure>> {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) {
      return err(transactionNotFoundFailure(id));
    }

    this.logger.log(
      `[execute] Transaction ${id} — DB status: ${transaction.status}, wompiTransactionId: ${transaction.wompiTransactionId ?? 'none'}`,
    );

    // If the DB status is still PENDING and we have a Wompi transaction ID,
    // fetch the live status from Wompi to check if it has since been resolved.
    if (
      transaction.status === TransactionStatus.PENDING &&
      transaction.wompiTransactionId
    ) {
      let wompiStatus: string;
      try {
        wompiStatus = await this.paymentGateway.getTransactionStatus(
          transaction.wompiTransactionId,
        );
      } catch (err) {
        // Network or Wompi error — return the DB record as-is and let the poller retry
        this.logger.warn(
          `[execute] Failed to fetch live Wompi status for ${transaction.wompiTransactionId}: ${err}`,
        );
        return ok(transaction);
      }

      this.logger.log(
        `[execute] Wompi live status for ${transaction.wompiTransactionId}: ${wompiStatus}`,
      );

      // Only update the DB if Wompi has moved to a final status
      const mapped = WompiStatusMapper.toDomain(wompiStatus);

      if (FINAL_STATUSES.has(mapped)) {
        this.logger.log(
          `[execute] Updating DB status for ${id}: ${transaction.status} → ${mapped}`,
        );
        let updatedTransaction: Transaction;
        try {
          const transitionResult =
            await this.transactionRepository.updateStatusFromPending(
              id,
              mapped,
            );

          if (!transitionResult) {
            const latestTransaction = await this.transactionRepository.findById(id);
            if (!latestTransaction) {
              return err(transactionNotFoundFailure(id));
            }
            return ok(latestTransaction);
          }

          updatedTransaction = transitionResult;
        } catch {
          return err(transactionPersistenceFailure('update transaction status'));
        }

        // Decrement stock only if this request moved status from PENDING to APPROVED
        if (mapped === TransactionStatus.APPROVED) {
          this.logger.log(
            `[execute] Decrementing stock for product ${transaction.productId}`,
          );
          try {
            await this.productRepository.decrementStock(transaction.productId, 1);
          } catch {
            return err(stockUpdateFailedFailure(transaction.productId));
          }
        }

        return ok(updatedTransaction);
      }
    }

    return ok(transaction);
  }
}
