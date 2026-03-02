import { cn } from '../ui/cn';

export interface ProductInfoProps {
  name: string;
  price: number;
  description: string;
  className?: string;
}

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function ProductInfo({ name, price, description, className }: ProductInfoProps) {
  return (
    <div className={cn('relative z-10 flex flex-1 flex-col', className)}>
      <div className='mb-2 flex items-start justify-between gap-4'>
        <h3 className='font-heading text-xl font-medium text-white leading-tight'>
          {name}
        </h3>
        <span className='font-sans text-lg font-bold text-accent'>
          {formatCOP(price)}
        </span>
      </div>
      <p className='mb-6 flex-1 text-sm text-slate-300 line-clamp-3'>
        {description}
      </p>
    </div>
  );
}
