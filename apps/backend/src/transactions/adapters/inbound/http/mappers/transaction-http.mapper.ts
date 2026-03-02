import { TransactionView } from '../../../../domain/models/transaction-view';
import { TransactionResponseDto } from '../dto/transaction-response.dto';

export class TransactionHttpMapper {
  static toResponse(transaction: TransactionView): TransactionResponseDto {
    return {
      id: transaction.id,
      status: transaction.status,
      reference: transaction.reference,
      amountInCents: transaction.amountInCents,
      productName: transaction.productName,
    };
  }
}
