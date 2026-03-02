import { ProductType } from '../../../../domain/models/product-type.enum';

export class ProductResponseDto {
  id: string;
  name: string;
  price: number;
  description: string;
  type: ProductType;
  stock: number;
  position: number;
  sku: string;
  image: string;
}
