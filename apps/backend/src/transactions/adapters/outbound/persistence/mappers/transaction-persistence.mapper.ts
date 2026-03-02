import { Transaction } from '../../../../domain/models/transaction';
import { TransactionOrmEntity } from '../entities/transaction.orm-entity';

export class TransactionPersistenceMapper {
  static toDomain(entity: TransactionOrmEntity): Transaction {
    return {
      id: entity.id,
      productId: entity.productId,
      amountInCents: parseInt(entity.amountInCents, 10),
      currency: entity.currency,
      status: entity.status,
      wompiTransactionId: entity.wompiTransactionId,
      reference: entity.reference,
      customerName: entity.customerName,
      customerEmail: entity.customerEmail,
      deliveryAddress: entity.deliveryAddress,
      deliveryCity: entity.deliveryCity,
      customerPhone: entity.customerPhone,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toEntity(
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
  ): Partial<TransactionOrmEntity> {
    return {
      productId: transaction.productId,
      amountInCents: String(transaction.amountInCents),
      currency: transaction.currency,
      status: transaction.status,
      wompiTransactionId: transaction.wompiTransactionId,
      reference: transaction.reference,
      customerName: transaction.customerName,
      customerEmail: transaction.customerEmail,
      deliveryAddress: transaction.deliveryAddress,
      deliveryCity: transaction.deliveryCity,
      customerPhone: transaction.customerPhone,
    };
  }
}
