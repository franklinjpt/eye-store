import { GlassCard } from '../ui/glass-card';
import { ProductImage } from './product-image.component';
import { ProductInfo } from './product-info.component';
import { AddToCartButton } from './add-to-cart-button.component';

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  imageUrl: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const isOutOfStock = product.stock === 0;

  return (
    <GlassCard>
      <ProductImage
        src={product.imageUrl}
        alt={product.name}
        stock={product.stock}
      />
      <ProductInfo
        name={product.name}
        price={product.price}
        description={product.description}
      />
      <AddToCartButton disabled={isOutOfStock} onClick={onAddToCart} />
    </GlassCard>
  );
}
