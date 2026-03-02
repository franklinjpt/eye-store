import { Product } from '../../../../domain/models/product';
import { ProductOrmEntity } from '../entities/product.orm-entity';

export class ProductPersistenceMapper {
  static toDomain(entity: ProductOrmEntity): Product {
    return {
      id: entity.id,
      name: entity.name,
      price: Number(entity.price),
      description: entity.description,
      type: entity.type,
      stock: entity.stock,
      sku: entity.sku,
      image: entity.image,
    };
  }

  static toEntity(product: Omit<Product, 'id'>): Partial<ProductOrmEntity> {
    return {
      name: product.name,
      price: String(product.price),
      description: product.description,
      type: product.type,
      stock: product.stock,
      sku: product.sku,
      image: product.image,
    };
  }
}
