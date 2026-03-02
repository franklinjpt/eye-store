import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base disabled:pointer-events-none disabled:opacity-50 px-6 py-3',
          variant === 'primary' &&
            'bg-primary text-white shadow-[0_0_20px_var(--color-primary-glow)] hover:bg-violet-500 hover:shadow-[0_0_30px_var(--color-primary-glow)] hover:-translate-y-0.5',
          variant === 'secondary' &&
            'bg-surface-hover text-white hover:bg-slate-600',
          variant === 'glass' &&
            'bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:border-white/20 hover:shadow-[0_4_20px_rgba(0,0,0,0.2)]',
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
