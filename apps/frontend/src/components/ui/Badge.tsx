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
          'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wider border backdrop-blur-md backdrop-saturate-150 backdrop-brightness-75 shadow-[0_2px_10px_rgba(0,0,0,0.45)] ring-1 ring-inset ring-black/25 [text-shadow:0_1px_2px_rgba(0,0,0,0.75)]',
          variant === 'default' && 'bg-black/65 text-white border-white/25',
          variant === 'success' &&
            'bg-emerald-950/70 text-emerald-100 border-emerald-300/35',
          variant === 'warning' &&
            'bg-amber-950/70 text-amber-100 border-amber-300/35',
          variant === 'error' &&
            'bg-rose-950/70 text-rose-100 border-rose-300/35',
          className,
        )}
        {...props}
      />
    );
  },
);
Badge.displayName = 'Badge';
