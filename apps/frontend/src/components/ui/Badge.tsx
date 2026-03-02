import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from './cn';

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wider backdrop-blur-md border',
          variant === 'default' && 'bg-white/10 text-white border-white/20',
          variant === 'success' &&
            'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          variant === 'warning' &&
            'bg-amber-500/20 text-amber-300 border-amber-500/30',
          variant === 'error' &&
            'bg-rose-500/20 text-rose-300 border-rose-500/30',
          className,
        )}
        {...props}
      />
    );
  },
);
Badge.displayName = 'Badge';
