import { Transaction } from '../../../../domain/models/transaction';
import { TransactionResponseDto } from '../dto/transaction-response.dto';

export class TransactionHttpMapper {
  static toResponse(transaction: Transaction, productName: string): TransactionResponseDto {
    return {
      id: transaction.id,
      status: transaction.status,
      reference: transaction.reference,
      amountInCents: transaction.amountInCents,
      productName,
    };
  }
}
