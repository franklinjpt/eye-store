import { Badge } from '../ui/Badge';
import { cn } from '../ui/cn';

export interface ProductImageProps {
  src: string;
  alt: string;
  stock: number;
  className?: string;
}

export function ProductImage({ src, alt, stock, className }: ProductImageProps) {
  const isOutOfStock = stock === 0;

  return (
    <div className={cn('relative z-10 mb-6 flex h-64 items-center justify-center overflow-hidden rounded-xl bg-black/20', className)}>
      <img
        src={src}
        alt={alt}
        className='h-full w-full object-cover transition-transform duration-700 group-hover:scale-110'
        loading='lazy'
      />
      <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60' />
      <div className='absolute top-4 right-4'>
        <Badge variant={isOutOfStock ? 'error' : 'success'}>
          {isOutOfStock ? 'Out of Stock' : `${stock} in stock`}
        </Badge>
      </div>
    </div>
  );
}
