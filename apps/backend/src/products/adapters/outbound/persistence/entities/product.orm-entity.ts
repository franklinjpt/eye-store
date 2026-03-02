import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ProductType } from '../../../../domain/models/product-type.enum';

@Entity('products')
export class ProductOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: ProductType })
  type: ProductType;

  @Column({ type: 'int' })
  stock: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  sku: string;

  @Column({ type: 'text' })
  image: string;
}
