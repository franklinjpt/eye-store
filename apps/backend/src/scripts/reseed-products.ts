import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { ProductRepositoryPort } from '../products/domain/ports/outbound/product-repository.port';
import { PRODUCT_REPOSITORY_PORT } from '../products/products.tokens';
import {
  generateSeedProducts,
  SEED_PRODUCT_COUNT,
} from '../products/adapters/outbound/persistence/product-seed.factory';

async function reseedProducts(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const dataSource = app.get(DataSource, { strict: false });
    if (!dataSource) {
      throw new Error(
        'TypeORM DataSource not found. Ensure SKIP_DB is not true when running reseed.',
      );
    }

    await dataSource.query('TRUNCATE TABLE products RESTART IDENTITY CASCADE;');

    const productRepository = app.get<ProductRepositoryPort>(
      PRODUCT_REPOSITORY_PORT,
    );
    await productRepository.saveMany(generateSeedProducts(SEED_PRODUCT_COUNT));

    // Keep plain output for CI/dev scripts.
    console.log(`Reseeded ${SEED_PRODUCT_COUNT} products successfully.`);
  } finally {
    await app.close();
  }
}

reseedProducts().catch((error: unknown) => {
  console.error('Failed to reseed products:', error);
  process.exit(1);
});
