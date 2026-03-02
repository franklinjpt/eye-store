import { Transaction } from '../../models/transaction';
import { Result } from '../../../../common/result';
import { TransactionFailure } from '../../errors/transaction.failure';

export interface GetTransactionUseCase {
  execute(id: string): Promise<Result<Transaction, TransactionFailure>>;
}
