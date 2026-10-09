import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glass';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary:
        'bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-700 hover:to-secondary-600 text-white shadow-md shadow-primary-500/20 active:scale-[0.98]',
      secondary:
        'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 active:scale-[0.98]',
      outline:
        'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 active:scale-[0.98]',
      ghost:
        'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 active:scale-[0.98]',
      danger:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 active:scale-[0.98]',
      glass:
        'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/80 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm active:scale-[0.98]',
    };

    const sizes = {
      xs: 'text-[11px] px-2.5 py-1 rounded-lg gap-1.5 font-semibold',
      sm: 'text-xs px-3 py-1.5 rounded-xl gap-1.5 font-semibold',
      md: 'text-xs px-4 py-2.5 rounded-xl gap-2 font-bold',
      lg: 'text-sm px-5 py-3 rounded-xl gap-2 font-bold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center select-none transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
