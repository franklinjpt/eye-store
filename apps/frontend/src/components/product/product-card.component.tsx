import { GlassCard } from '../ui/glass-card';
import { ProductImage } from './product-image.component';
import { ProductInfo } from './product-info.component';
import { AddToCartButton } from './add-to-cart-button.component';
import type { Product } from '@/types';

export type { Product };

interface ProductCardProps {
  product: Product;
  onBuy?: () => void;
}

export function ProductCard({ product, onBuy }: ProductCardProps) {
  const isOutOfStock = product.stock === 0;

  return (
    <GlassCard>
      <ProductImage
        src={product.image}
        alt={product.name}
        stock={product.stock}
      />
      <ProductInfo
        name={product.name}
        price={product.price}
        description={product.description}
      />
      <AddToCartButton
        disabled={isOutOfStock}
        onClick={onBuy}
        label={isOutOfStock ? 'Out of Stock' : 'Pay with Credit Card'}
      />
    </GlassCard>
  );
}
