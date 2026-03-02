import { Result } from '../../../../common/result';
import { TransactionFailure } from '../../errors/transaction.failure';
import { TransactionView } from '../../models/transaction-view';
import { CreateTransactionCommand } from './create-transaction.use-case';

export interface CreateTransactionViewUseCase {
  execute(
    command: CreateTransactionCommand,
  ): Promise<Result<TransactionView, TransactionFailure>>;
}
