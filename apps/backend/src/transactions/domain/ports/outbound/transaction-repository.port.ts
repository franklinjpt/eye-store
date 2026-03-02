import { Transaction } from '../../models/transaction';
import { TransactionStatus } from '../../models/transaction-status.enum';

export interface TransactionRepositoryPort {
  save(
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Transaction>;
  findById(id: string): Promise<Transaction | null>;
  updateStatus(
    id: string,
    status: TransactionStatus,
    wompiTransactionId?: string,
  ): Promise<Transaction>;
}
