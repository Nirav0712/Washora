import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'interactive' | 'accent' | 'solid';
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variantStyles = {
    default:
      'bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]',
    interactive:
      'bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_14px_35px_rgba(37,99,235,0.12)] hover:border-primary-300/60 dark:hover:border-primary-500/40 transition-all duration-200 cursor-pointer active:scale-[0.99]',
    accent:
      'bg-gradient-to-br from-white/90 via-white/70 to-primary-50/40 dark:from-slate-900/90 dark:to-primary-950/30 backdrop-blur-md border border-primary-100/60 dark:border-primary-900/40 shadow-glass',
    solid:
      'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm',
  };

  return (
    <div
      className={cn(
        'rounded-2xl transition-all duration-200',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
