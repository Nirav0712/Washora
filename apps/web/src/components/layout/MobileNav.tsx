'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Plus, Package, Users, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export const MobileNav: React.FC = () => {
  const pathname = usePathname();

  const items = [
    { label: 'Home', href: '/', icon: LayoutDashboard },
    { label: 'Orders', href: '/orders', icon: Package },
    { label: 'POS', href: '/pos', icon: Plus, isAction: true },
    { label: 'Customers', href: '/customers', icon: Users },
    { label: 'More', href: '/products', icon: Menu },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 px-4 py-2 flex items-center justify-around shadow-lg">
      {items.map((item) => {
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);

        if (item.isAction) {
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center justify-center -mt-6"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-600 to-secondary-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/30 active:scale-95 transition-transform">
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 mt-1">
                + Order
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-xs font-medium transition-colors',
              isActive
                ? 'text-primary-600 dark:text-primary-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px]">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};
