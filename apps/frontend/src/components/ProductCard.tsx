import { ShoppingBag } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { IconWrapper } from './ui/IconWrapper';

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
}

export function ProductCard({ product }: ProductCardProps) {
  const isOutOfStock = product.stock === 0;

  return (
    <div className='group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:bg-white/10 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]'>
      {/* Glow Effect */}
      <div className='absolute -inset-2 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100' />

      {/* Image Node */}
      <div className='relative z-10 mb-6 flex h-64 items-center justify-center overflow-hidden rounded-xl bg-black/20'>
        <img
          src={product.imageUrl}
          alt={product.name}
          className='h-full w-full object-cover transition-transform duration-700 group-hover:scale-110'
          loading='lazy'
        />
        <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60' />
        <div className='absolute top-4 right-4'>
          <Badge variant={isOutOfStock ? 'error' : 'success'}>
            {isOutOfStock ? 'Out of Stock' : `${product.stock} in stock`}
          </Badge>
        </div>
      </div>

      {/* Content Node */}
      <div className='relative z-10 flex flex-1 flex-col'>
        <div className='mb-2 flex items-start justify-between gap-4'>
          <h3 className='font-heading text-xl font-medium text-white leading-tight'>
            {product.name}
          </h3>
          <span className='font-sans text-lg font-bold text-accent'>
            ${product.price.toFixed(2)}
          </span>
        </div>

        <p className='mb-6 flex-1 text-sm text-slate-300 line-clamp-3'>
          {product.description}
        </p>

        {/* Action node */}
        <Button
          variant='glass'
          disabled={isOutOfStock}
          className='w-full gap-2 group-hover:bg-primary/20 group-hover:border-primary/30 group-hover:text-white'
        >
          <IconWrapper className='h-8 w-8 border-none bg-transparent p-1 group-hover:text-accent transition-colors'>
            <ShoppingBag className='h-5 w-5' />
          </IconWrapper>
          <span className='font-sans tracking-wide'>Add to Cart</span>
        </Button>
      </div>
    </div>
  );
}
