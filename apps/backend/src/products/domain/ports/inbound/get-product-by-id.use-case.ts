import { Product } from '../../models/product';
import { ProductFailure } from '../../errors/product.failure';
import { Result } from '../../../../common/result';

export interface GetProductByIdUseCase {
  execute(id: string): Promise<Result<Product, ProductFailure>>;
}
