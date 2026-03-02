import { Inject, Injectable } from '@nestjs/common';
import { Product } from '../models/product';
import { GetProductByIdUseCase } from '../ports/inbound/get-product-by-id.use-case';
import { ProductRepositoryPort } from '../ports/outbound/product-repository.port';
import { PRODUCT_REPOSITORY_PORT } from '../../products.tokens';
import { ProductFailure, productNotFoundFailure } from '../errors/product.failure';
import { err, ok, Result } from '../../../common/result';

@Injectable()
export class GetProductByIdService implements GetProductByIdUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepository: ProductRepositoryPort,
  ) {}

  async execute(id: string): Promise<Result<Product, ProductFailure>> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      return err(productNotFoundFailure(id));
    }

    return ok(product);
  }
}
