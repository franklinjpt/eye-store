import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { GetTransactionUseCase } from '../ports/inbound/get-transaction.use-case';
import { TransactionRepositoryPort } from '../ports/outbound/transaction-repository.port';
import { PaymentGatewayPort } from '../ports/outbound/payment-gateway.port';
import { Transaction } from '../models/transaction';
import { TransactionStatus } from '../models/transaction-status.enum';
import {
  TRANSACTION_REPOSITORY_PORT,
  PAYMENT_GATEWAY_PORT,
} from '../../transactions.tokens';

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
  ) {}

  async execute(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction with id "${id}" not found`);
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
        return transaction;
      }

      this.logger.log(
        `[execute] Wompi live status for ${transaction.wompiTransactionId}: ${wompiStatus}`,
      );

      // Only update the DB if Wompi has moved to a final status
      const statusMap: Record<string, TransactionStatus> = {
        APPROVED: TransactionStatus.APPROVED,
        DECLINED: TransactionStatus.DECLINED,
        VOIDED: TransactionStatus.VOIDED,
        ERROR: TransactionStatus.ERROR,
        PENDING: TransactionStatus.PENDING,
      };
      const mapped = statusMap[wompiStatus] ?? TransactionStatus.ERROR;

      if (FINAL_STATUSES.has(mapped)) {
        this.logger.log(
          `[execute] Updating DB status for ${id}: ${transaction.status} → ${mapped}`,
        );
        return this.transactionRepository.updateStatus(id, mapped);
      }
    }

    return transaction;
  }
}
