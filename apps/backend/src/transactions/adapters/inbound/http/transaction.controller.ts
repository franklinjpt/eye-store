import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import { CreateTransactionViewUseCase } from '../../../domain/ports/inbound/create-transaction-view.use-case';
import { GetTransactionViewUseCase } from '../../../domain/ports/inbound/get-transaction-view.use-case';
import { TransactionFailure } from '../../../domain/errors/transaction.failure';
import {
  CREATE_TRANSACTION_VIEW_USE_CASE,
  GET_TRANSACTION_VIEW_USE_CASE,
} from '../../../transactions.tokens';
import { CreateTransactionRequestDto } from './dto/create-transaction-request.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { TransactionHttpMapper } from './mappers/transaction-http.mapper';

@Controller('api/transactions')
export class TransactionController {
  constructor(
    @Inject(CREATE_TRANSACTION_VIEW_USE_CASE)
    private readonly createTransactionViewUseCase: CreateTransactionViewUseCase,
    @Inject(GET_TRANSACTION_VIEW_USE_CASE)
    private readonly getTransactionViewUseCase: GetTransactionViewUseCase,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateTransactionRequestDto,
  ): Promise<TransactionResponseDto> {
    const transactionResult = await this.createTransactionViewUseCase.execute({
      productId: dto.productId,
      tokenId: dto.tokenId,
      acceptanceToken: dto.acceptanceToken,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      deliveryAddress: dto.deliveryAddress,
      deliveryCity: dto.deliveryCity,
      customerPhone: dto.customerPhone,
    });
    if (transactionResult.kind === 'err') {
      throw this.mapFailureToHttpException(transactionResult.error);
    }

    return TransactionHttpMapper.toResponse(transactionResult.value);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TransactionResponseDto> {
    const transactionResult = await this.getTransactionViewUseCase.execute(id);
    if (transactionResult.kind === 'err') {
      throw this.mapFailureToHttpException(transactionResult.error);
    }

    return TransactionHttpMapper.toResponse(transactionResult.value);
  }

  private mapFailureToHttpException(failure: TransactionFailure): HttpException {
    switch (failure.code) {
      case 'TRANSACTION_NOT_FOUND':
      case 'PRODUCT_NOT_FOUND':
        return new HttpException(failure.message, HttpStatus.NOT_FOUND);
      case 'OUT_OF_STOCK':
      case 'STOCK_UPDATE_FAILED':
        return new HttpException(failure.message, HttpStatus.CONFLICT);
      case 'PAYMENT_GATEWAY_ERROR':
        return new HttpException(failure.message, HttpStatus.BAD_GATEWAY);
      case 'TRANSACTION_PERSISTENCE_ERROR':
        return new HttpException(
          failure.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      default:
        return new HttpException(
          'Unexpected transaction failure',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
  }
}
