import type { ReactNode } from 'react';
import { cn } from './cn';

export type FormFieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function FormField({
  label,
  htmlFor,
  error,
  required = false,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className='text-sm font-medium text-slate-300'>
        {label}
        {required && (
          <>
            <span className='ml-0.5 text-rose-400' aria-hidden='true'>
              *
            </span>
            <span className='sr-only'>required</span>
          </>
        )}
      </label>
      {children}
      {error && <p className='text-xs text-rose-400'>{error}</p>}
    </div>
  );
}
