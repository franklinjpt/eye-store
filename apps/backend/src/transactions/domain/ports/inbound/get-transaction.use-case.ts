import { Transaction } from '../../models/transaction';

export interface GetTransactionUseCase {
  execute(id: string): Promise<Transaction>;
}
