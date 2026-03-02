import { ProductType } from './product-type.enum';

export type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  type: ProductType;
  stock: number;
  position: number;
  sku: string;
  image: string;
};
