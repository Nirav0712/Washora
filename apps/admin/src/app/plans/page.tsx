'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminApiClient } from '../../lib/api';
import { Layers, PlusCircle, Check, X, Archive, Edit } from 'lucide-react';
import { SubscriptionPlan } from '@washora/shared';

export default function PlansListPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const res = await AdminApiClient.listPlans();
      setPlans(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Subscription Plans</h1>
          <p className="text-sm text-slate-500 mt-0.5">Define feature entitlements, resource limits, and pricing tiers</p>
        </div>

        <Link
          href="/plans/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Plan Tier</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-3 py-16 text-center text-slate-400">
            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : plans.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-slate-400">No subscription plans found</div>
        ) : (
          plans.map((p) => {
            const featureCount = Object.values(p.features || {}).filter(Boolean).length;
            return (
              <div key={p.id || (p as any)._id} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-5">
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">{p.name}</h2>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      p.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {p.isActive ? 'Active' : 'Archived'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{p.slug}</p>
                  <p className="text-xs text-slate-600 mt-3 min-h-[32px]">{p.description || 'Standard plan tier'}</p>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="text-3xl font-black text-slate-900">
                      ₹{p.price.toLocaleString('en-IN')}
                      <span className="text-xs text-slate-400 font-normal uppercase ml-1">/{p.billingInterval}</span>
                    </div>
                    <p className="text-xs text-blue-600 font-semibold mt-1">{p.trialDays}-day free trial</p>
                  </div>

                  {/* Limits summary */}
                  <div className="mt-5 space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span>Max Branches:</span>
                      <span className="font-bold text-slate-800">{p.limits?.MAX_BRANCHES || 1}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span>Max Staff:</span>
                      <span className="font-bold text-slate-800">{p.limits?.MAX_STAFF || 5}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span>Max Customers:</span>
                      <span className="font-bold text-slate-800">{p.limits?.MAX_CUSTOMERS || 500}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Active Features:</span>
                      <span className="font-bold text-blue-600">{featureCount} modules</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/plans/${p.id || (p as any)._id}`}
                    className="w-full text-center py-2 px-3 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-xs font-bold text-slate-700 transition-colors"
                  >
                    Configure Plan Details →
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
