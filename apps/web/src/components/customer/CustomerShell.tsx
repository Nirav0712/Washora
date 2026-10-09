'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  FileText,
  MapPin,
  Bell,
  Settings,
  LogOut,
  Sparkles,
  Phone,
} from 'lucide-react';
import { useCustomerAuth } from '@/context/CustomerAuthContext';

interface CustomerShellProps {
  children: ReactNode;
}

const navItems = [
  { label: 'Overview', href: '/portal', icon: LayoutDashboard },
  { label: 'Orders', href: '/portal/orders', icon: ShoppingBag },
  { label: 'Payments', href: '/portal/payments', icon: CreditCard },
  { label: 'Invoices', href: '/portal/invoices', icon: FileText },
  { label: 'Addresses', href: '/portal/addresses', icon: MapPin },
  { label: 'Updates', href: '/portal/notifications', icon: Bell },
  { label: 'Settings', href: '/portal/settings', icon: Settings },
];

export const CustomerShell: React.FC<CustomerShellProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { customer, tenant, isAuthenticated, isLoading, logout } = useCustomerAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/portal/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !pathname.startsWith('/portal/login')) {
    router.push('/portal/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#172033] flex flex-col pb-20 md:pb-8">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-blue-500/20">
            {tenant?.name ? tenant.name.charAt(0).toUpperCase() : 'W'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                {tenant?.name || 'Washora Laundry'}
              </span>
              <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                Self-Service
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Welcome back, {customer?.name || 'Customer'}
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/70">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile & Actions */}
        <div className="flex items-center gap-2.5">
          {tenant?.phone && (
            <a
              href={`tel:${tenant.phone}`}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-all border border-slate-200"
            >
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>Contact Shop</span>
            </a>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-2 rounded-xl transition-all"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-2 py-2 flex items-center justify-around shadow-lg">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[11px] font-medium transition-colors ${
                isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
