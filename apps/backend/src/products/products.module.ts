import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './adapters/inbound/http/product.controller';
import { ProductRepository } from './adapters/outbound/persistence/product.repository';
import { ProductOrmEntity } from './adapters/outbound/persistence/entities/product.orm-entity';
import { ProductSeedService } from './adapters/outbound/persistence/product-seed.service';
import { GetProductsService } from './domain/services/get-products.service';
import { GetProductByIdService } from './domain/services/get-product-by-id.service';
import {
  PRODUCT_REPOSITORY_PORT,
  GET_PRODUCTS_USE_CASE,
  GET_PRODUCT_BY_ID_USE_CASE,
} from './products.tokens';

@Module({
  imports: [TypeOrmModule.forFeature([ProductOrmEntity])],
  controllers: [ProductController],
  providers: [
    ProductRepository,
    {
      provide: PRODUCT_REPOSITORY_PORT,
      useExisting: ProductRepository,
    },
    GetProductsService,
    GetProductByIdService,
    {
      provide: GET_PRODUCTS_USE_CASE,
      useExisting: GetProductsService,
    },
    {
      provide: GET_PRODUCT_BY_ID_USE_CASE,
      useExisting: GetProductByIdService,
    },
    ProductSeedService,
  ],
})
export class ProductsModule {}
