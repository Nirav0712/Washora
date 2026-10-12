'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PublicNavbar } from '@/components/marketing/PublicNavbar';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import {
  Store,
  User,
  Users,
  Shield,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

type LoginRoleType = 'SHOP_OWNER' | 'SHOP_STAFF' | 'PARTNER' | 'SUPER_ADMIN';

export default function UnifiedLoginPage() {
  const router = useRouter();
  const [roleType, setRoleType] = useState<LoginRoleType>('SHOP_OWNER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (roleType === 'SHOP_OWNER' || roleType === 'SHOP_STAFF') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            tenantSlug: tenantSlug.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (data.success && data.data?.accessToken) {
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('token', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken || '');
          localStorage.setItem('user', JSON.stringify(data.data.user));
          localStorage.setItem('tenant', JSON.stringify(data.data.tenant));
          localStorage.setItem('role', JSON.stringify(data.data.role));

          // Redirect to shop dashboard
          router.push('/dashboard');
        } else {
          setError(data.message || 'Invalid email or password');
        }
      } else {
        // Platform Partner Admin or Super Admin
        const res = await fetch('/api/platform/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (data.success && data.data?.token) {
          localStorage.setItem('adminToken', data.data.token);
          localStorage.setItem('admin', JSON.stringify(data.data.admin));

          // If partner, go to partner dashboard on admin app (port 3002)
          if (data.data.admin.role === 'PARTNER_ADMIN') {
            window.location.href = 'http://localhost:3002/partner-dashboard';
          } else {
            window.location.href = 'http://localhost:3002/';
          }
        } else {
          setError(data.message || 'Invalid platform administrator credentials');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Network error during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] dark:bg-[#0B0F19] text-[#172033] dark:text-[#F1F5F9] flex flex-col justify-between">
      <PublicNavbar />

      <div className="max-w-md w-full mx-auto px-4 py-12">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-black text-xl flex items-center justify-center mx-auto shadow-md shadow-blue-600/20">
              W
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Sign In to Washora
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Role-aware authentication with isolated security scoping.
            </p>
          </div>

          {/* Role Category Tabs (Shop Owner & 4 role buttons commented out) */}
          {/*
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setRoleType('SHOP_OWNER');
                setError(null);
              }}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                roleType === 'SHOP_OWNER'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Shop Owner</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRoleType('SHOP_STAFF');
                setError(null);
              }}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                roleType === 'SHOP_STAFF'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Staff / Cashier</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRoleType('PARTNER');
                setError(null);
              }}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                roleType === 'PARTNER'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Sales Partner</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRoleType('SUPER_ADMIN');
                setError(null);
              }}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                roleType === 'SUPER_ADMIN'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Platform Admin</span>
            </button>
          </div>
          */}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder={
                    roleType === 'SUPER_ADMIN'
                      ? 'admin@washora.com'
                      : roleType === 'PARTNER'
                      ? 'partner@washora.com'
                      : 'owner@laundry.com'
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {(roleType === 'SHOP_OWNER' || roleType === 'SHOP_STAFF') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Shop Slug / Subdomain (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. cleansprint"
                  value={tenantSlug}
                  onChange={(e) => setTenantSlug(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-extrabold text-sm shadow-md transition disabled:opacity-50"
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center space-y-2 text-xs text-slate-500">
            <p>
              Don't have a laundry shop account yet?{' '}
              <Link href="/register" className="font-bold text-blue-600 hover:underline">
                Start 14-Day Free Trial
              </Link>
            </p>
            <p>
              Are you a customer tracking clothes?{' '}
              <Link href="/portal/login" className="font-bold text-cyan-600 hover:underline">
                Customer Portal Login
              </Link>
            </p>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
