import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionController } from './adapters/inbound/http/transaction.controller';
import { TransactionRepository } from './adapters/outbound/persistence/transaction.repository';
import { TransactionOrmEntity } from './adapters/outbound/persistence/entities/transaction.orm-entity';
import { WompiPaymentAdapter } from './adapters/outbound/wompi/wompi-payment.adapter';
import { CreateTransactionService } from './domain/services/create-transaction.service';
import { GetTransactionService } from './domain/services/get-transaction.service';
import { CreateTransactionViewService } from './domain/services/create-transaction-view.service';
import { GetTransactionViewService } from './domain/services/get-transaction-view.service';
import { ProductsModule } from '../products/products.module';
import {
  TRANSACTION_REPOSITORY_PORT,
  PAYMENT_GATEWAY_PORT,
  CREATE_TRANSACTION_USE_CASE,
  GET_TRANSACTION_USE_CASE,
  CREATE_TRANSACTION_VIEW_USE_CASE,
  GET_TRANSACTION_VIEW_USE_CASE,
} from './transactions.tokens';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([TransactionOrmEntity]),
    ProductsModule,
  ],
  controllers: [TransactionController],
  providers: [
    TransactionRepository,
    {
      provide: TRANSACTION_REPOSITORY_PORT,
      useExisting: TransactionRepository,
    },
    WompiPaymentAdapter,
    {
      provide: PAYMENT_GATEWAY_PORT,
      useExisting: WompiPaymentAdapter,
    },
    CreateTransactionService,
    {
      provide: CREATE_TRANSACTION_USE_CASE,
      useExisting: CreateTransactionService,
    },
    GetTransactionService,
    {
      provide: GET_TRANSACTION_USE_CASE,
      useExisting: GetTransactionService,
    },
    CreateTransactionViewService,
    {
      provide: CREATE_TRANSACTION_VIEW_USE_CASE,
      useExisting: CreateTransactionViewService,
    },
    GetTransactionViewService,
    {
      provide: GET_TRANSACTION_VIEW_USE_CASE,
      useExisting: GetTransactionViewService,
    },
  ],
})
export class TransactionsModule {}
