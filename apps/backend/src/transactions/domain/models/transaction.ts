import { TransactionStatus } from './transaction-status.enum';

export type Transaction = {
  id: string;
  productId: string;
  amountInCents: number;
  currency: string;
  status: TransactionStatus;
  wompiTransactionId: string | null;
  reference: string;
  customerName: string;
  customerEmail: string;
  deliveryAddress: string;
  deliveryCity: string;
  customerPhone: string;
  createdAt: Date;
  updatedAt: Date;
};
