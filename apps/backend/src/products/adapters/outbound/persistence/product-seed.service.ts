import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ProductRepositoryPort } from '../../../domain/ports/outbound/product-repository.port';
import { ProductType } from '../../../domain/models/product-type.enum';
import { PRODUCT_REPOSITORY_PORT } from '../../../products.tokens';
import { Product } from '../../../domain/models/product';

const SEED_PRODUCTS: Omit<Product, 'id'>[] = [
  {
    name: 'Classic Aviator Frame',
    price: 129.99,
    description:
      'Timeless aviator-style frame with lightweight titanium construction.',
    type: ProductType.FRAME,
    stock: 50,
    sku: 'FRM-AVI-001',
    image: 'https://placehold.co/400x300?text=Aviator+Frame',
  },
  {
    name: 'Blue Light Blocking Lens',
    price: 79.99,
    description:
      'High-quality blue light filtering lens for digital screen protection.',
    type: ProductType.LENS,
    stock: 100,
    sku: 'LNS-BLB-001',
    image: 'https://placehold.co/400x300?text=Blue+Light+Lens',
  },
  {
    name: 'Premium Microfiber Cleaning Kit',
    price: 14.99,
    description:
      'Complete cleaning kit with microfiber cloth and spray solution.',
    type: ProductType.ACCESSORY,
    stock: 200,
    sku: 'ACC-CLN-001',
    image: 'https://placehold.co/400x300?text=Cleaning+Kit',
  },
];

@Injectable()
export class ProductSeedService implements OnApplicationBootstrap {
  constructor(
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepository: ProductRepositoryPort,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const existingCount = await this.productRepository.count();
    if (existingCount === 0) {
      await this.productRepository.saveMany(SEED_PRODUCTS);
    }
  }
}
