import { TransactionStatus } from '../../../../domain/models/transaction-status.enum';

export class TransactionResponseDto {
  id: string;
  status: TransactionStatus;
  reference: string;
  amountInCents: number;
  productName: string;
}
