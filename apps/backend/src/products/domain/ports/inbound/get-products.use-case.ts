import { Product } from '../../models/product';

export interface GetProductsUseCase {
  execute(): Promise<Product[]>;
}
