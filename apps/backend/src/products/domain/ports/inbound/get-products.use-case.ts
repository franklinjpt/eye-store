import { Product } from '../../models/product';
import { Result } from '../../../../common/result';

export interface GetProductsUseCase {
  execute(): Promise<Result<Product[], never>>;
}
