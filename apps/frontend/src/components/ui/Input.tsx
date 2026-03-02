import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from './Button'; // Utility from Button file

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-12 w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-4 py-2 text-sm text-white font-sans transition-all duration-300',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent focus-visible:bg-white/10',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
