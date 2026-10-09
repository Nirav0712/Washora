import React from 'react';
import { GlassCard } from './GlassCard';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  subtext?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  subtext,
  icon: Icon,
  iconColor = 'text-primary-600 dark:text-primary-400',
  iconBg = 'bg-primary-50 dark:bg-primary-950/60',
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <GlassCard
      variant="default"
      className={cn(
        'p-5 relative overflow-hidden group hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-300',
        className
      )}
    >
      {/* Background soft ambient gradient orb */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br from-primary-400/10 to-secondary-400/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              {value}
            </span>
          </div>
        </div>

        {Icon && (
          <div
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center border border-white/60 dark:border-white/10 shadow-sm transition-transform duration-300 group-hover:scale-110',
              iconBg
            )}
          >
            <Icon className={cn('w-5 h-5', iconColor)} />
          </div>
        )}
      </div>

      <div className="mt-3.5 flex items-center justify-between text-xs pt-3 border-t border-slate-100/80 dark:border-slate-800/80">
        <div className="flex items-center gap-1.5 font-medium">
          {change && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-semibold text-[11px]',
                isPositive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
              )}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {change}
            </span>
          )}
          {subtext && (
            <span className="text-slate-500 dark:text-slate-400">
              {subtext}
            </span>
          )}
        </div>

        {actionText && onAction && (
          <button
            onClick={onAction}
            className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            {actionText} →
          </button>
        )}
      </div>
    </GlassCard>
  );
};
