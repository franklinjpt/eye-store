import { Inject, Injectable } from '@nestjs/common';
import { Product } from '../models/product';
import { GetProductByIdUseCase } from '../ports/inbound/get-product-by-id.use-case';
import { ProductRepositoryPort } from '../ports/outbound/product-repository.port';
import { PRODUCT_REPOSITORY_PORT } from '../../products.tokens';

@Injectable()
export class GetProductByIdService implements GetProductByIdUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepository: ProductRepositoryPort,
  ) {}

  async execute(id: string): Promise<Product | null> {
    return this.productRepository.findById(id);
  }
}
