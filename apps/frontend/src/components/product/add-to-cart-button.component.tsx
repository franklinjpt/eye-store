import { ShoppingBag } from 'lucide-react';
import { Button } from '../ui/Button';
import { IconWrapper } from '../ui/IconWrapper';
import { cn } from '../ui/cn';

export interface AddToCartButtonProps {
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function AddToCartButton({ disabled, onClick, className }: AddToCartButtonProps) {
  return (
    <Button
      variant='glass'
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'w-full gap-2 group-hover:bg-primary/20 group-hover:border-primary/30 group-hover:text-white',
        className,
      )}
    >
      <IconWrapper className='h-8 w-8 border-none bg-transparent p-1 group-hover:text-accent transition-colors'>
        <ShoppingBag className='h-5 w-5' />
      </IconWrapper>
      <span className='font-sans tracking-wide'>Add to Cart</span>
    </Button>
  );
}
