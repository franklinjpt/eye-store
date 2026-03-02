import { TransactionStatus } from './transaction-status.enum';

export type TransactionView = {
  id: string;
  status: TransactionStatus;
  reference: string;
  amountInCents: number;
  productName: string;
};
