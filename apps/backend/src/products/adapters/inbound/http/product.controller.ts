import {
  Controller,
  Get,
  Inject,
  NotFoundException,
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
    const products = await this.getProductsUseCase.execute();
    return products.map(ProductHttpMapper.toResponse);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ProductResponseDto> {
    const product = await this.getProductByIdUseCase.execute(id);
    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }
    return ProductHttpMapper.toResponse(product);
  }
}
