import type { ReactNode } from 'react';
import { cn } from './cn';

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, htmlFor, error, children, className }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className='text-sm font-medium text-slate-300'>
        {label}
      </label>
      {children}
      {error && (
        <p className='text-xs text-rose-400'>{error}</p>
      )}
    </div>
  );
}
