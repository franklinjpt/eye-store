import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../../domain/models/product';
import { ProductRepositoryPort } from '../../../domain/ports/outbound/product-repository.port';
import { ProductOrmEntity } from './entities/product.orm-entity';
import { ProductPersistenceMapper } from './mappers/product-persistence.mapper';

@Injectable()
export class ProductRepository implements ProductRepositoryPort {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly ormRepository: Repository<ProductOrmEntity>,
  ) {}

  async findAll(): Promise<Product[]> {
    const entities = await this.ormRepository.find();
    return entities.map(ProductPersistenceMapper.toDomain);
  }

  async findById(id: string): Promise<Product | null> {
    const entity = await this.ormRepository.findOne({ where: { id } });
    return entity ? ProductPersistenceMapper.toDomain(entity) : null;
  }

  async count(): Promise<number> {
    return this.ormRepository.count();
  }

  async saveMany(products: Omit<Product, 'id'>[]): Promise<Product[]> {
    const entities = products.map((p) => {
      const partial = ProductPersistenceMapper.toEntity(p);
      return this.ormRepository.create(partial);
    });
    const saved = await this.ormRepository.save(entities);
    return saved.map(ProductPersistenceMapper.toDomain);
  }

  async decrementStock(productId: string, quantity: number): Promise<void> {
    const result = await this.ormRepository
      .createQueryBuilder()
      .update()
      .set({ stock: () => `stock - ${quantity}` })
      .where('id = :id AND stock >= :quantity', { id: productId, quantity })
      .execute();

    if (result.affected === 0) {
      throw new Error('Insufficient stock or product not found');
    }
  }
}
