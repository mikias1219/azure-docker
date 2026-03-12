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
          'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0b10] disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20': variant === 'default',
            'bg-red-600 text-white hover:bg-red-500': variant === 'destructive',
            'border border-white/10 bg-transparent text-slate-200 hover:bg-white/5': variant === 'outline',
            'bg-white/10 text-slate-200 hover:bg-white/15': variant === 'secondary',
            'text-slate-300 hover:bg-white/5 hover:text-white': variant === 'ghost',
            'text-blue-400 underline-offset-4 hover:underline hover:text-blue-300': variant === 'link',
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
