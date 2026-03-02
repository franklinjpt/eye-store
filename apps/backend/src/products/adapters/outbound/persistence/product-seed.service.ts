import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ProductRepositoryPort } from '../../../domain/ports/outbound/product-repository.port';
import { PRODUCT_REPOSITORY_PORT } from '../../../products.tokens';
import {
  generateSeedProducts,
  SEED_PRODUCT_COUNT,
} from './product-seed.factory';

@Injectable()
export class ProductSeedService implements OnApplicationBootstrap {
  constructor(
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepository: ProductRepositoryPort,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const existingCount = await this.productRepository.count();
    if (existingCount < SEED_PRODUCT_COUNT) {
      const missingProducts = SEED_PRODUCT_COUNT - existingCount;
      await this.productRepository.saveMany(
        generateSeedProducts(missingProducts, existingCount + 1),
      );
    }
  }
}
