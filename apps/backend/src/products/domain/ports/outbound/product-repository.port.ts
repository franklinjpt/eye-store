import { Product } from '../../models/product';

export interface ProductRepositoryPort {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  count(): Promise<number>;
  saveMany(products: Omit<Product, 'id'>[]): Promise<Product[]>;
}
