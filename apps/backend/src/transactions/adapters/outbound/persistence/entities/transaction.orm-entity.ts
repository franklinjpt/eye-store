import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TransactionStatus } from '../../../../domain/models/transaction-status.enum';

@Entity('transactions')
export class TransactionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @Column({ type: 'bigint', name: 'amount_in_cents' })
  amountInCents: string;

  @Column({ type: 'varchar', length: 3, default: 'COP' })
  currency: string;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'wompi_transaction_id' })
  wompiTransactionId: string | null;

  @Column({ type: 'varchar', length: 100, unique: true })
  reference: string;

  @Column({ type: 'varchar', length: 255, name: 'customer_name' })
  customerName: string;

  @Column({ type: 'varchar', length: 255, name: 'customer_email' })
  customerEmail: string;

  @Column({ type: 'text', name: 'delivery_address' })
  deliveryAddress: string;

  @Column({ type: 'varchar', length: 255, name: 'delivery_city' })
  deliveryCity: string;

  @Column({ type: 'varchar', length: 50, name: 'customer_phone' })
  customerPhone: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
