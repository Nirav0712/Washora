'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminApiClient } from '../../../lib/api';
import { Layers, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { BillingInterval, FeatureKey, LimitKey } from '@washora/shared';

export default function CreatePlanPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    billingInterval: BillingInterval.MONTHLY,
    price: 1999,
    currency: 'INR',
    trialDays: 14,
    isActive: true,
    isPublic: true,
    features: {
      [FeatureKey.POS]: true,
      [FeatureKey.CUSTOMERS]: true,
      [FeatureKey.ORDERS]: true,
      [FeatureKey.PROCESSING]: true,
      [FeatureKey.QC]: true,
      [FeatureKey.STAFF]: true,
      [FeatureKey.ATTENDANCE]: true,
      [FeatureKey.PAYROLL]: false,
      [FeatureKey.EXPENSES]: true,
      [FeatureKey.SUPPLIERS]: false,
      [FeatureKey.PURCHASES]: false,
      [FeatureKey.INVENTORY]: false,
      [FeatureKey.FINANCE]: false,
      [FeatureKey.PICKUP_DELIVERY]: true,
      [FeatureKey.NOTIFICATIONS]: true,
      [FeatureKey.WHATSAPP]: false,
      [FeatureKey.CUSTOMER_PORTAL]: true,
      [FeatureKey.CRM]: false,
      [FeatureKey.REPORTS]: true,
      [FeatureKey.MULTI_BRANCH]: false,
    } as Record<string, boolean>,
    limits: {
      [LimitKey.MAX_BRANCHES]: 2,
      [LimitKey.MAX_STAFF]: 8,
      [LimitKey.MAX_CUSTOMERS]: 1500,
      [LimitKey.MAX_MONTHLY_ORDERS]: 800,
      [LimitKey.MAX_USERS]: 4,
      [LimitKey.MAX_PRODUCTS]: 100,
      [LimitKey.MAX_INVENTORY_ITEMS]: 100,
      [LimitKey.MAX_WHATSAPP_MESSAGES]: 500,
      [LimitKey.MAX_STORAGE]: 3,
    } as Record<string, number>,
  });

  const toggleFeature = (k: string) => {
    setForm({
      ...form,
      features: {
        ...form.features,
        [k]: !form.features[k],
      },
    });
  };

  const handleLimitChange = (k: string, val: number) => {
    setForm({
      ...form,
      limits: {
        ...form.limits,
        [k]: val,
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await AdminApiClient.createPlan(form);
      router.push('/plans');
    } catch (err: any) {
      setError(err.message || 'Plan creation failed');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/plans" className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Create Subscription Plan Tier</h1>
          <p className="text-sm text-slate-500">Configure plan pricing, modular feature entitlements, and operational caps</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm space-y-8">
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Layers className="w-4 h-4 text-blue-600" />
            Plan Identity & Pricing
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Plan Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Growth Pro Tier"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Slug (Optional)
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="growth-pro"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Monthly Price (INR) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Plan Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Ideal for expanding 2-3 branch laundry setups with pickup-delivery automation."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Modular Feature Entitlements */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Modular Feature Entitlements
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.values(FeatureKey).map((fKey) => {
              const enabled = !!form.features[fKey];
              return (
                <button
                  type="button"
                  key={fKey}
                  onClick={() => toggleFeature(fKey)}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    enabled
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-slate-50/60 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xs font-bold font-mono">{fKey}</span>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    enabled ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'
                  }`}>
                    {enabled ? '✓' : '✕'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Plan Resource Limits */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Operational Caps & Limits
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {Object.values(LimitKey).map((lKey) => (
              <div key={lKey}>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {lKey}
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.limits[lKey] ?? 0}
                  onChange={(e) => handleLimitChange(lKey, parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            href="/plans"
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-600/25 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Creating Plan...' : 'Create Plan Tier'}
          </button>
        </div>
      </form>
    </div>
  );
}
