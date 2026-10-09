'use client';

import React, { useEffect, useState } from 'react';
import { AdminApiClient } from '../../lib/api';
import { BarChart3, AlertTriangle, Building2, CheckCircle2 } from 'lucide-react';
import { TenantUsageSummary } from '@washora/shared';

export default function UsageAnalyticsPage() {
  const [summaries, setSummaries] = useState<TenantUsageSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AdminApiClient.getAllUsage()
      .then((res) => setSummaries(res || []))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Tenant Capacity & Usage</h1>
        <p className="text-sm text-slate-500 mt-0.5">Cross-tenant resource consumption, quota limits, and near-limit alerts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-2 py-16 text-center text-slate-400">
            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : summaries.length === 0 ? (
          <div className="col-span-2 py-16 text-center text-slate-400">No tenant usage data available</div>
        ) : (
          summaries.map((u) => (
            <div key={u.tenantId} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="font-bold text-slate-900">{u.tenantName}</h2>
                  <p className="text-xs text-blue-600 font-semibold mt-0.5">{u.planName}</p>
                </div>

                {u.warnings && u.warnings.length > 0 ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Near/At Limit
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Within Quota
                  </span>
                )}
              </div>

              {/* Progress bars */}
              <div className="space-y-3">
                {/* Branches */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-600">Branches</span>
                    <span className="text-slate-800 font-bold">{u.metrics.branches.current} / {u.metrics.branches.limit} ({u.metrics.branches.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${u.metrics.branches.percentage >= 90 ? 'bg-red-500' : 'bg-blue-600'}`}
                      style={{ width: `${u.metrics.branches.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Staff */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-600">Staff Members</span>
                    <span className="text-slate-800 font-bold">{u.metrics.staff.current} / {u.metrics.staff.limit} ({u.metrics.staff.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${u.metrics.staff.percentage >= 90 ? 'bg-red-500' : 'bg-blue-600'}`}
                      style={{ width: `${u.metrics.staff.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Customers */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-600">Registered Customers</span>
                    <span className="text-slate-800 font-bold">{u.metrics.customers.current} / {u.metrics.customers.limit} ({u.metrics.customers.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${u.metrics.customers.percentage >= 90 ? 'bg-red-500' : 'bg-blue-600'}`}
                      style={{ width: `${u.metrics.customers.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Monthly Orders */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-600">Monthly Orders</span>
                    <span className="text-slate-800 font-bold">{u.metrics.monthlyOrders.current} / {u.metrics.monthlyOrders.limit} ({u.metrics.monthlyOrders.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${u.metrics.monthlyOrders.percentage >= 90 ? 'bg-red-500' : 'bg-blue-600'}`}
                      style={{ width: `${u.metrics.monthlyOrders.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
