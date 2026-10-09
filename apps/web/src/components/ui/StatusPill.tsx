import React from 'react';
import { OrderStatus, PaymentStatus } from '@washora/shared';
import { cn } from '@/lib/utils';

interface StatusPillProps {
  status?: OrderStatus | PaymentStatus | string | null;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status = 'UNKNOWN',
  size = 'md',
  showDot = true,
  className = '',
}) => {
  const currentStatus = status || 'UNKNOWN';
  const getStatusConfig = () => {
    switch (currentStatus) {
      case OrderStatus.RECEIVED:
        return {
          label: 'Received',
          bg: 'bg-purple-50 dark:bg-purple-950/50',
          text: 'text-purple-700 dark:text-purple-300',
          border: 'border-purple-200/70 dark:border-purple-800/40',
          dot: 'bg-purple-500',
        };
      case OrderStatus.PROCESSING:
        return {
          label: 'Processing',
          bg: 'bg-blue-50 dark:bg-blue-950/50',
          text: 'text-blue-700 dark:text-blue-300',
          border: 'border-blue-200/70 dark:border-blue-800/40',
          dot: 'bg-blue-500 animate-pulse',
        };
      case OrderStatus.QC:
        return {
          label: 'QC Check',
          bg: 'bg-amber-50 dark:bg-amber-950/50',
          text: 'text-amber-700 dark:text-amber-300',
          border: 'border-amber-200/70 dark:border-amber-800/40',
          dot: 'bg-amber-500',
        };
      case OrderStatus.READY:
        return {
          label: 'Ready',
          bg: 'bg-emerald-50 dark:bg-emerald-950/50',
          text: 'text-emerald-700 dark:text-emerald-300',
          border: 'border-emerald-200/70 dark:border-emerald-800/40',
          dot: 'bg-emerald-500',
        };
      case OrderStatus.OUT_FOR_DELIVERY:
        return {
          label: 'Out for Delivery',
          bg: 'bg-cyan-50 dark:bg-cyan-950/50',
          text: 'text-cyan-700 dark:text-cyan-300',
          border: 'border-cyan-200/70 dark:border-cyan-800/40',
          dot: 'bg-cyan-500',
        };
      case OrderStatus.DELIVERED:
        return {
          label: 'Delivered',
          bg: 'bg-teal-50 dark:bg-teal-950/50',
          text: 'text-teal-700 dark:text-teal-300',
          border: 'border-teal-200/70 dark:border-teal-800/40',
          dot: 'bg-teal-500',
        };
      case OrderStatus.CANCELLED:
        return {
          label: 'Cancelled',
          bg: 'bg-rose-50 dark:bg-rose-950/50',
          text: 'text-rose-700 dark:text-rose-300',
          border: 'border-rose-200/70 dark:border-rose-800/40',
          dot: 'bg-rose-500',
        };

      // Payment Statuses
      case PaymentStatus.PAID:
        return {
          label: 'Paid',
          bg: 'bg-emerald-50 dark:bg-emerald-950/50',
          text: 'text-emerald-700 dark:text-emerald-300',
          border: 'border-emerald-200/70 dark:border-emerald-800/40',
          dot: 'bg-emerald-500',
        };
      case PaymentStatus.PARTIAL:
        return {
          label: 'Partial Due',
          bg: 'bg-orange-50 dark:bg-orange-950/50',
          text: 'text-orange-700 dark:text-orange-300',
          border: 'border-orange-200/70 dark:border-orange-800/40',
          dot: 'bg-orange-500',
        };
      case PaymentStatus.UNPAID:
        return {
          label: 'Unpaid',
          bg: 'bg-rose-50 dark:bg-rose-950/50',
          text: 'text-rose-700 dark:text-rose-300',
          border: 'border-rose-200/70 dark:border-rose-800/40',
          dot: 'bg-rose-500',
        };

      default:
        return {
          label: status,
          bg: 'bg-slate-100 dark:bg-slate-800',
          text: 'text-slate-700 dark:text-slate-300',
          border: 'border-slate-200 dark:border-slate-700',
          dot: 'bg-slate-400',
        };
    }
  };

  const config = getStatusConfig();

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border transition-all select-none',
        config.bg,
        config.text,
        config.border,
        sizeClasses[size],
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full inline-block',
            config.dot
          )}
        />
      )}
      <span>{config.label}</span>
    </span>
  );
};
