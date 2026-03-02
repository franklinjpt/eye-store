import { Transaction } from '../../models/transaction';
import { Result } from '../../../../common/result';
import { TransactionFailure } from '../../errors/transaction.failure';

export type CreateTransactionCommand = {
  productId: string;
  tokenId: string;
  acceptanceToken: string;
  customerName: string;
  customerEmail: string;
  deliveryAddress: string;
  deliveryCity: string;
  customerPhone: string;
};

export interface CreateTransactionUseCase {
  execute(
    command: CreateTransactionCommand,
  ): Promise<Result<Transaction, TransactionFailure>>;
}
