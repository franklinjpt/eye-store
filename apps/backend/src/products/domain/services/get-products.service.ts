import { Inject, Injectable } from '@nestjs/common';
import { Product } from '../models/product';
import { GetProductsUseCase } from '../ports/inbound/get-products.use-case';
import { ProductRepositoryPort } from '../ports/outbound/product-repository.port';
import { PRODUCT_REPOSITORY_PORT } from '../../products.tokens';

@Injectable()
export class GetProductsService implements GetProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepository: ProductRepositoryPort,
  ) {}

  async execute(): Promise<Product[]> {
    return this.productRepository.findAll();
  }
}
