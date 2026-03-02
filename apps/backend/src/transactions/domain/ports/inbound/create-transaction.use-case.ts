import { Transaction } from '../../models/transaction';

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
  execute(command: CreateTransactionCommand): Promise<Transaction>;
}
