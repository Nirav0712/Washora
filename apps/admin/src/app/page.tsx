'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminApiClient } from '../lib/api';
import { PlatformDashboardData } from '@washora/shared';
import {
  Building2,
  CreditCard,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  PlusCircle,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState<PlatformDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AdminApiClient.getDashboard()
      .then((res) => setData(res))
      .catch((err) => setError(err.message || 'Failed to load dashboard data'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700">
        <p className="font-semibold">Error loading executive dashboard</p>
        <p className="text-sm mt-1">{error || 'Unable to retrieve data'}</p>
      </div>
    );
  }

  const { metrics, recentTenants, recentSubscriptions, recentAuditLogs } = data;

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Executive SaaS Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Platform multi-tenant governance, revenue, and subscription analytics</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/tenants/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Provision Tenant</span>
          </Link>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Tenants */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tenants</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900">{metrics.totalTenants}</div>
            <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-500">
              <span className="text-emerald-600 font-bold">{metrics.activeTenants} Active</span>
              <span>•</span>
              <span className="text-blue-600 font-bold">{metrics.trialTenants} Trial</span>
            </div>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subscriptions</span>
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900">{metrics.activeSubscriptions}</div>
            <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-500">
              <span className="text-slate-600">{metrics.pastDueTenants} Past Due</span>
              <span>•</span>
              <span className="text-red-500">{metrics.suspendedTenants} Suspended</span>
            </div>
          </div>
        </div>

        {/* MRR */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Recurring</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900">₹{metrics.mrr.toLocaleString('en-IN')}</div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Estimated Monthly Revenue</p>
          </div>
        </div>

        {/* ARR */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Annual Run Rate</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900">₹{metrics.arr.toLocaleString('en-IN')}</div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Annualized Projected Revenue</p>
          </div>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tenants */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Recent Tenants
            </h2>
            <Link href="/tenants" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentTenants.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">No tenants created yet</div>
            ) : (
              recentTenants.map((t: any) => (
                <div key={t.id} className="p-4 hover:bg-slate-50/70 flex items-center justify-between transition-colors">
                  <div>
                    <Link href={`/tenants/${t.id}`} className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors">
                      {t.name}
                    </Link>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{t.slug}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      t.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : t.status === 'TRIAL'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {t.status}
                    </span>
                    <Link href={`/tenants/${t.id}`} className="text-xs text-slate-400 hover:text-slate-600">
                      Manage →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Subscriptions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-cyan-600" />
              Recent Subscriptions
            </h2>
            <Link href="/subscriptions" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentSubscriptions.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">No subscriptions active yet</div>
            ) : (
              recentSubscriptions.map((s: any) => (
                <div key={s.id} className="p-4 hover:bg-slate-50/70 flex items-center justify-between transition-colors">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{s.tenantName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.planName}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      s.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : s.status === 'TRIALING'
                        ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {s.status}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Period: {new Date(s.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Governance & Audit Stream */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Platform Governance Activity
          </h2>
          <Link href="/audit" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Full Audit Trail <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-4">
          {recentAuditLogs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No platform audit logs recorded yet</p>
          ) : (
            <div className="space-y-3">
              {recentAuditLogs.slice(0, 5).map((log: any) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-mono font-bold text-slate-800">{log.action}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600">{log.entity}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
