import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20': variant === 'default',
            'bg-red-600 text-white hover:bg-red-500': variant === 'destructive',
            'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50': variant === 'outline',
            'bg-slate-100 text-slate-900 hover:bg-slate-200': variant === 'secondary',
            'text-slate-700 hover:bg-slate-100 hover:text-slate-900': variant === 'ghost',
            'text-blue-700 underline-offset-4 hover:underline hover:text-blue-800': variant === 'link',
          },
          {
            'h-10 px-4 py-2': size === 'default',
            'h-9 rounded-lg px-3 text-xs': size === 'sm',
            'h-11 rounded-xl px-8 text-base': size === 'lg',
            'h-10 w-10 rounded-xl': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
