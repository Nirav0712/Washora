'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminApiClient } from '../../../lib/api';
import { Layers, ArrowLeft, Archive, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { FeatureKey, LimitKey } from '@washora/shared';

export default function EditPlanPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    price: 0,
    trialDays: 14,
    isActive: true,
    isPublic: true,
    features: {} as Record<string, boolean>,
    limits: {} as Record<string, number>,
  });

  useEffect(() => {
    if (id) {
      AdminApiClient.getPlan(id)
        .then((res) => {
          setForm({
            name: res.name || '',
            slug: res.slug || '',
            description: res.description || '',
            price: res.price || 0,
            trialDays: res.trialDays ?? 14,
            isActive: res.isActive !== false,
            isPublic: res.isPublic !== false,
            features: res.features || {},
            limits: res.limits || {},
          });
        })
        .catch((err) => setMsg({ text: err.message, type: 'error' }))
        .finally(() => setIsLoading(false));
    }
  }, [id]);

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
    setMsg(null);
    setIsSubmitting(true);

    try {
      await AdminApiClient.updatePlan(id, form);
      setMsg({ text: 'Subscription plan updated successfully', type: 'success' });
    } catch (err: any) {
      setMsg({ text: err.message || 'Update failed', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this plan tier?')) return;
    try {
      await AdminApiClient.archivePlan(id);
      setMsg({ text: 'Plan archived successfully', type: 'success' });
      setForm((prev) => ({ ...prev, isActive: false, isPublic: false }));
    } catch (err: any) {
      setMsg({ text: err.message, type: 'error' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/plans" className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Edit Plan: {form.name}</h1>
            <p className="text-sm text-slate-500 font-mono">Slug: {form.slug}</p>
          </div>
        </div>

        {form.isActive && (
          <button
            type="button"
            onClick={handleArchive}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-colors"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archive Plan</span>
          </button>
        )}
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border text-sm ${
          msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm space-y-8">
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Layers className="w-4 h-4 text-blue-600" />
            Plan Metadata & Pricing
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Plan Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Monthly Price (INR)
              </label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Trial Days
              </label>
              <input
                type="number"
                min="0"
                value={form.trialDays}
                onChange={(e) => setForm({ ...form, trialDays: parseInt(e.target.value) || 0 })}
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
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Feature toggles */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Feature Entitlements
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

        {/* Limits */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Resource Limits
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
            {isSubmitting ? 'Saving...' : 'Save Plan Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
