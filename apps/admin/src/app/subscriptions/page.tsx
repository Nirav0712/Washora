'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminApiClient } from '../../lib/api';
import { CreditCard, Filter, Eye, RefreshCw, AlertCircle } from 'lucide-react';
import { SubscriptionStatus } from '@washora/shared';

export default function SubscriptionsListPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubs = async () => {
    setIsLoading(true);
    try {
      const res = await AdminApiClient.listSubscriptions({
        page,
        limit: 15,
        status: statusFilter || undefined,
      });
      setSubscriptions(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubs();
  }, [page, statusFilter]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Active Subscriptions</h1>
          <p className="text-sm text-slate-500 mt-0.5">SaaS subscription states, billing periods, and plan transitions</p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
          >
            <option value="">All Subscription Statuses</option>
            {Object.values(SubscriptionStatus).map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-6">Tenant Organization</th>
                <th className="py-3.5 px-6">Plan & Interval</th>
                <th className="py-3.5 px-6">Billing Period</th>
                <th className="py-3.5 px-6">Subscription Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No subscriptions found matching criteria
                  </td>
                </tr>
              ) : (
                subscriptions.map((s) => (
                  <tr key={s._id || s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{s.tenantId?.name || 'Unknown Tenant'}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{s.tenantId?.slug || '—'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800">{s.planId?.name || 'Custom Tier'}</div>
                      <div className="text-xs text-slate-400 mt-0.5">₹{s.planId?.price || 0} / {s.billingInterval}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-xs text-slate-800">
                        {new Date(s.currentPeriodStart).toLocaleDateString()} → {new Date(s.currentPeriodEnd).toLocaleDateString()}
                      </div>
                      {s.trialEnd && s.status === 'TRIALING' && (
                        <div className="text-[11px] text-blue-600 font-medium mt-0.5">
                          Trial ends: {new Date(s.trialEnd).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${
                        s.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : s.status === 'TRIALING'
                          ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                          : s.status === 'PAST_DUE'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/subscriptions/${s._id || s.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
