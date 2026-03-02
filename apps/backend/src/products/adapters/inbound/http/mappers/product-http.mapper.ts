import { Product } from '../../../../domain/models/product';
import { ProductResponseDto } from '../dto/product-response.dto';

export class ProductHttpMapper {
  static toResponse(product: Product): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = product.id;
    dto.name = product.name;
    dto.price = product.price;
    dto.description = product.description;
    dto.type = product.type;
    dto.stock = product.stock;
    dto.sku = product.sku;
    dto.image = product.image;
    return dto;
  }
}
