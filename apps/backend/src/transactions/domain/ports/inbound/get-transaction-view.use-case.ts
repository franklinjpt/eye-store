import { Result } from '../../../../common/result';
import { TransactionFailure } from '../../errors/transaction.failure';
import { TransactionView } from '../../models/transaction-view';

export interface GetTransactionViewUseCase {
  execute(id: string): Promise<Result<TransactionView, TransactionFailure>>;
}
