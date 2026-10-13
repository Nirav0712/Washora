'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from './BrandLogo';
import {
  LayoutDashboard,
  Zap,
  Package,
  Sparkles,
  Users,
  Shirt,
  Truck,
  CreditCard,
  BarChart3,
  Settings,
  ChevronLeft,
  Sun,
  Moon,
  Store,
  UserCheck,
  CalendarCheck,
  Banknote,
  Receipt,
  Boxes,
  ShoppingBag,
  TrendingUp,
  Building2,
  MapPin,
  PackageCheck,
  Navigation,
  MessageSquare,
  ShieldCheck,
  LifeBuoy,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { isDark, toggleTheme, tenant, activeBranch, orders } = useApp();

  const activeOrdersCount = orders.filter(
    (o) => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED'
  ).length;

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, badge: '' },
    { name: 'POS Counter', href: '/pos', icon: Zap, badge: 'Fast', highlight: true },
    { name: 'Orders', href: '/orders', icon: Package, badge: activeOrdersCount ? `${activeOrdersCount}` : '' },
    { name: 'Products & Services', href: '/products', icon: Shirt, badge: '' },
    { name: 'Processing & QC', href: '/processing', icon: Sparkles, badge: '' },
    { name: 'Pickup & Delivery', href: '/pickup-delivery', icon: Truck, badge: 'Hub' },
    { name: 'Pickups', href: '/pickups', icon: MapPin, badge: '' },
    { name: 'Deliveries', href: '/deliveries', icon: PackageCheck, badge: '' },
    { name: 'Agent Dispatch', href: '/delivery', icon: Navigation, badge: 'Driver' },
    { name: 'Communications', href: '/notifications', icon: MessageSquare, badge: 'WhatsApp' },
    { name: 'Customers', href: '/customers', icon: Users, badge: '' },
    { name: 'Staff & Team', href: '/staff', icon: UserCheck, badge: '' },
    { name: 'Roles & RBAC', href: '/roles', icon: ShieldCheck, badge: '' },
    { name: 'Attendance & Leave', href: '/attendance', icon: CalendarCheck, badge: '' },
    { name: 'Payroll', href: '/payroll', icon: Banknote, badge: '' },
    { name: 'Finance & P&L', href: '/finance', icon: TrendingUp, badge: '' },
    { name: 'Expenses', href: '/expenses', icon: Receipt, badge: '' },
    { name: 'Inventory & Stock', href: '/inventory', icon: Boxes, badge: '' },
    { name: 'Suppliers', href: '/suppliers', icon: Building2, badge: '' },
    { name: 'Purchases', href: '/purchases', icon: ShoppingBag, badge: '' },
    { name: 'Payments & Due', href: '/payments', icon: CreditCard, badge: '' },
    { name: 'Analytics & Reports', href: '/reports', icon: BarChart3, badge: '' },
    { name: 'Support & Helpdesk', href: '/support', icon: LifeBuoy, badge: '24/7' },
    { name: 'Settings', href: '/settings', icon: Settings, badge: '' },
  ];

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r transition-all duration-300 z-30 sticky top-0 h-screen select-none',
        collapsed ? 'w-20' : 'w-64',
        'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/80 dark:border-slate-800 shadow-sm'
      )}
    >
      {/* Brand Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 min-h-[72px]">
        <Link href="/" className="flex items-center">
          <BrandLogo collapsed={collapsed} />
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
            collapsed && 'hidden'
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Branch & Hub Pill */}
      {!collapsed && (
        <div className="px-3 py-2.5 mx-3 mt-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 flex items-center gap-2">
          <Store className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate">
              {activeBranch.name}
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {activeBranch.code} · Active
            </p>
          </div>
        </div>
      )}

      {/* Main Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 group relative',
                isActive
                  ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold shadow-md shadow-primary-500/25'
                  : item.highlight
                  ? 'text-primary-700 dark:text-primary-300 bg-primary-50/70 dark:bg-primary-950/40 hover:bg-primary-100/70 border border-primary-200/50 dark:border-primary-800/40 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/50',
                collapsed && 'justify-center px-2'
              )}
            >
              <item.icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-transform group-hover:scale-110',
                  isActive
                    ? 'text-white'
                    : item.highlight
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-slate-500 dark:text-slate-400'
                )}
              />

              {!collapsed && (
                <span className="truncate flex-1 tracking-tight">{item.name}</span>
              )}

              {!collapsed && item.badge && !isActive && (
                <span
                  className={cn(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                    item.highlight
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  )}
                >
                  {item.badge}
                </span>
              )}

              {/* Tooltip on collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 rounded-md bg-slate-900 text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer / Settings / User */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between gap-1">
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors flex-1',
              collapsed && 'justify-center px-2'
            )}
          >
            <Settings className="w-4 h-4 text-slate-500 shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Link>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isDark ? 'Switch to Light' : 'Switch to Dark'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* User Card */}
        <div
          className={cn(
            'p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-2.5',
            collapsed && 'justify-center p-1.5'
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-secondary-500 text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
            SO
          </div>
          {!collapsed && (
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                Shop Owner
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {tenant.name}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
