import { Inject, Injectable } from '@nestjs/common';
import { err, ok, Result } from '../../../common/result';
import { PRODUCT_REPOSITORY_PORT } from '../../../products/products.tokens';
import { ProductRepositoryPort } from '../../../products/domain/ports/outbound/product-repository.port';
import {
  CREATE_TRANSACTION_USE_CASE,
} from '../../transactions.tokens';
import { TransactionFailure } from '../errors/transaction.failure';
import { TransactionView } from '../models/transaction-view';
import { CreateTransactionCommand, CreateTransactionUseCase } from '../ports/inbound/create-transaction.use-case';
import { CreateTransactionViewUseCase } from '../ports/inbound/create-transaction-view.use-case';

const UNKNOWN_PRODUCT_NAME = 'Unknown Product';

@Injectable()
export class CreateTransactionViewService implements CreateTransactionViewUseCase {
  constructor(
    @Inject(CREATE_TRANSACTION_USE_CASE)
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepository: ProductRepositoryPort,
  ) {}

  async execute(
    command: CreateTransactionCommand,
  ): Promise<Result<TransactionView, TransactionFailure>> {
    const transactionResult = await this.createTransactionUseCase.execute(command);
    if (transactionResult.kind === 'err') {
      return err(transactionResult.error);
    }

    const product = await this.productRepository.findById(
      transactionResult.value.productId,
    );

    return ok({
      id: transactionResult.value.id,
      status: transactionResult.value.status,
      reference: transactionResult.value.reference,
      amountInCents: transactionResult.value.amountInCents,
      productName: product?.name ?? UNKNOWN_PRODUCT_NAME,
    });
  }
}
