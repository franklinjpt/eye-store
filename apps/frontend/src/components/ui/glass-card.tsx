import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from './cn';

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, glow = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-500',
          glow && 'hover:-translate-y-2 hover:bg-white/10 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]',
          className,
        )}
        {...props}
      >
        {glow && (
          <div className='absolute -inset-2 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100' />
        )}
        {children}
      </div>
    );
  },
);
GlassCard.displayName = 'GlassCard';
