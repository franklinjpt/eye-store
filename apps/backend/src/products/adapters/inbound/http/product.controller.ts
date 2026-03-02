import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
} from '@nestjs/common';
import { GetProductsUseCase } from '../../../domain/ports/inbound/get-products.use-case';
import { GetProductByIdUseCase } from '../../../domain/ports/inbound/get-product-by-id.use-case';
import {
  GET_PRODUCTS_USE_CASE,
  GET_PRODUCT_BY_ID_USE_CASE,
} from '../../../products.tokens';
import { ProductHttpMapper } from './mappers/product-http.mapper';
import { ProductResponseDto } from './dto/product-response.dto';
import { ProductFailure } from '../../../domain/errors/product.failure';

@Controller('api/stock')
export class ProductController {
  constructor(
    @Inject(GET_PRODUCTS_USE_CASE)
    private readonly getProductsUseCase: GetProductsUseCase,
    @Inject(GET_PRODUCT_BY_ID_USE_CASE)
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
  ) {}

  @Get()
  async findAll(): Promise<ProductResponseDto[]> {
    const result = await this.getProductsUseCase.execute();
    if (result.kind === 'err') {
      throw new HttpException(
        'Unexpected product failure',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return result.value.map(ProductHttpMapper.toResponse);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ProductResponseDto> {
    const result = await this.getProductByIdUseCase.execute(id);
    if (result.kind === 'err') {
      throw this.mapFailureToHttpException(result.error);
    }

    return ProductHttpMapper.toResponse(result.value);
  }

  private mapFailureToHttpException(failure: ProductFailure): HttpException {
    if (failure.code === 'PRODUCT_NOT_FOUND') {
      return new HttpException(failure.message, HttpStatus.NOT_FOUND);
    }

    return new HttpException('Unexpected product failure', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
