import type { ReactNode } from 'react';
import { cn } from './Button';

export interface IconWrapperProps {
  children: ReactNode;
  className?: string;
}

export function IconWrapper({ children, className }: IconWrapperProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-xl border border-white/10 backdrop-blur-md transition-colors',
        'p-2 bg-white/5 text-white',
        className,
      )}
    >
      {children}
    </div>
  );
}
