import { Body, Controller, Inject, Post } from '@nestjs/common';
import { CreateTransactionUseCase } from '../../../domain/ports/inbound/create-transaction.use-case';
import { ProductRepositoryPort } from '../../../../products/domain/ports/outbound/product-repository.port';
import { CREATE_TRANSACTION_USE_CASE } from '../../../transactions.tokens';
import { PRODUCT_REPOSITORY_PORT } from '../../../../products/products.tokens';
import { CreateTransactionRequestDto } from './dto/create-transaction-request.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { TransactionHttpMapper } from './mappers/transaction-http.mapper';

@Controller('api/transactions')
export class TransactionController {
  constructor(
    @Inject(CREATE_TRANSACTION_USE_CASE)
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepository: ProductRepositoryPort,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateTransactionRequestDto,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.createTransactionUseCase.execute({
      productId: dto.productId,
      tokenId: dto.tokenId,
      acceptanceToken: dto.acceptanceToken,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      deliveryAddress: dto.deliveryAddress,
      deliveryCity: dto.deliveryCity,
      customerPhone: dto.customerPhone,
    });

    const product = await this.productRepository.findById(dto.productId);
    const productName = product?.name ?? 'Unknown Product';

    return TransactionHttpMapper.toResponse(transaction, productName);
  }
}
