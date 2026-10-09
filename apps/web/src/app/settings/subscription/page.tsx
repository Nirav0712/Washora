'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import {
  CreditCard,
  ArrowLeft,
  CheckCircle,
  Clock,
  Layers,
  BarChart3,
  Receipt,
  Shield,
  Zap,
} from 'lucide-react';

export default function SubscriptionSettingsPage() {
  const { tenant } = useApp();
  const [subData, setSubData] = useState<any>(null);
  const [usageData, setUsageData] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In actual deployment, calls /api/subscriptions/current, /api/subscriptions/usage, /api/subscriptions/invoices
    // Provide responsive fallback data if API is loading or in offline mock context
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('washora_token') : null;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

    Promise.all([
      fetch(`${apiUrl}/subscriptions/current`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`${apiUrl}/subscriptions/usage`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`${apiUrl}/subscriptions/invoices`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .catch(() => ({ items: [] })),
    ])
      .then(([sub, usage, inv]) => {
        setSubData(sub);
        setUsageData(usage);
        setInvoices(inv?.items || []);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const plan = subData?.planId || {
    name: 'Professional Plan',
    price: 2499,
    billingInterval: 'MONTHLY',
    features: {
      POS: true,
      CUSTOMERS: true,
      ORDERS: true,
      PROCESSING: true,
      QC: true,
      STAFF: true,
      ATTENDANCE: true,
      PAYROLL: true,
      EXPENSES: true,
      INVENTORY: true,
      PICKUP_DELIVERY: true,
      WHATSAPP: true,
      CUSTOMER_PORTAL: true,
      MULTI_BRANCH: true,
    },
    limits: {
      MAX_BRANCHES: 3,
      MAX_STAFF: 15,
      MAX_CUSTOMERS: 3000,
      MAX_MONTHLY_ORDERS: 1500,
    },
  };

  const usage = usageData || {
    metrics: {
      branches: { current: 1, limit: plan.limits?.MAX_BRANCHES || 3, percentage: 33 },
      staff: { current: 4, limit: plan.limits?.MAX_STAFF || 15, percentage: 27 },
      customers: { current: 120, limit: plan.limits?.MAX_CUSTOMERS || 3000, percentage: 4 },
      monthlyOrders: { current: 45, limit: plan.limits?.MAX_MONTHLY_ORDERS || 1500, percentage: 3 },
    },
    warnings: [],
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/settings" className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">SaaS Subscription & Plan</h1>
            <p className="text-sm text-slate-500">Manage your laundry SaaS plan tier, quotas, and invoice receipts</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            Active Subscription
          </span>
        </div>
      </div>

      {/* Plan Summary Card */}
      <GlassCard className="p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Current Active Tier</span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">{plan.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Multi-branch laundry business management with automated customer portal</p>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-3xl font-black text-slate-900">
              ₹{(plan.price || 2499).toLocaleString('en-IN')}
              <span className="text-xs text-slate-400 font-normal uppercase ml-1">/ month</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Next Renewal: Next 30-Day Period</p>
          </div>
        </div>

        {/* Quota Progress */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-600" />
            Plan Usage Quotas
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Branches */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600">Branches</span>
                <span className="text-slate-900 font-bold">{usage.metrics.branches.current} / {usage.metrics.branches.limit}</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${usage.metrics.branches.percentage}%` }}
                />
              </div>
            </div>

            {/* Staff */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600">Staff Members</span>
                <span className="text-slate-900 font-bold">{usage.metrics.staff.current} / {usage.metrics.staff.limit}</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${usage.metrics.staff.percentage}%` }}
                />
              </div>
            </div>

            {/* Customers */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600">Customers</span>
                <span className="text-slate-900 font-bold">{usage.metrics.customers.current} / {usage.metrics.customers.limit}</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${usage.metrics.customers.percentage}%` }}
                />
              </div>
            </div>

            {/* Monthly Orders */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600">Monthly Orders</span>
                <span className="text-slate-900 font-bold">{usage.metrics.monthlyOrders.current} / {usage.metrics.monthlyOrders.limit}</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${usage.metrics.monthlyOrders.percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Enabled Features Matrix */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Enabled SaaS Features
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {Object.entries(plan.features || {}).map(([fKey, enabled]) => (
              <div
                key={fKey}
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  enabled ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <span className="font-semibold font-mono">{fKey}</span>
                <span className="font-bold">{enabled ? '✓' : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Billing Invoice Receipts */}
      <GlassCard className="p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-blue-600" />
          SaaS Billing Invoices & Receipts
        </h3>

        <div className="divide-y divide-slate-100">
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No platform billing invoices generated yet
            </div>
          ) : (
            invoices.map((inv) => (
              <div key={inv._id || inv.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                  <p className="text-slate-400 mt-0.5">
                    Period: {new Date(inv.billingPeriodStart).toLocaleDateString()} – {new Date(inv.billingPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900">₹{inv.total.toLocaleString('en-IN')}</span>
                  <div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </div>
  );
}
