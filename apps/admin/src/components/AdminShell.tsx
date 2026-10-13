'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  LayoutDashboard,
  Building2,
  Layers,
  CreditCard,
  Receipt,
  BarChart3,
  ShieldCheck,
  Activity,
  LogOut,
  User,
  Shield,
  Sparkles,
  LifeBuoy,
} from 'lucide-react';

interface AdminShellProps {
  children: React.ReactNode;
}

export const AdminShell: React.FC<AdminShellProps> = ({ children }) => {
  const { admin, isLoading, logout } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!isLoading && !admin && !isLoginPage) {
      router.push('/login');
    }
  }, [isLoading, admin, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8FB]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading Washora Platform Admin...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  const isPartner = admin?.role === 'PARTNER_ADMIN';

  const navItems = isPartner
    ? [
        { label: 'Partner Overview', href: '/partner-dashboard', icon: LayoutDashboard },
      ]
    : [
        { label: 'Executive Overview', href: '/', icon: LayoutDashboard },
        { label: 'Partners & Resellers', href: '/partners', icon: User },
        { label: 'Tenants & Lifecycle', href: '/tenants', icon: Building2 },
        { label: 'Subscription Plans', href: '/plans', icon: Layers },
        { label: 'Active Subscriptions', href: '/subscriptions', icon: CreditCard },
        { label: 'SaaS Billing & Ledger', href: '/billing', icon: Receipt },
        { label: 'Usage & Capacity', href: '/usage', icon: BarChart3 },
        { label: 'Support & Helpdesk', href: '/support', icon: LifeBuoy },
        { label: 'Governance & Audit', href: '/audit', icon: ShieldCheck },
        { label: 'System Health', href: '/system-health', icon: Activity },
      ];

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col md:flex-row text-slate-900">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        {/* Brand */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            W
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-lg text-slate-900">Washora</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 tracking-wider">
                SaaS
              </span>
            </div>
            <p className="text-xs text-slate-500">Platform Governance</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Admin profile info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                {admin.name?.charAt(0) || 'A'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-800 truncate">{admin.name}</p>
                <p className="text-[10px] text-blue-600 font-medium uppercase truncate">{admin.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-700">Platform Admin Center</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              SaaS Operational
            </div>
          </div>
        </header>

        <div className="p-6 md:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};
