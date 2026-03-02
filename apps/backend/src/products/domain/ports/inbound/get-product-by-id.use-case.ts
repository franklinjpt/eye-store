import { Product } from '../../models/product';

export interface GetProductByIdUseCase {
  execute(id: string): Promise<Product | null>;
}
