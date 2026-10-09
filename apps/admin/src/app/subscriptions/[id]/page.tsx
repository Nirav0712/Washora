'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminApiClient } from '../../../lib/api';
import { CreditCard, ArrowLeft, Clock, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { BillingInterval } from '@washora/shared';

export default function SubscriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [sub, setSub] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [newPlanId, setNewPlanId] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchSub = async () => {
    setIsLoading(true);
    try {
      const [subRes, histRes, plansRes] = await Promise.all([
        AdminApiClient.getSubscription(id),
        AdminApiClient.getSubscriptionHistory(id),
        AdminApiClient.listPlans(),
      ]);
      setSub(subRes);
      setHistory(histRes || []);
      const activePlans = (plansRes || []).filter((p: any) => p.isActive);
      setPlans(activePlans);
      if (activePlans.length > 0 && !newPlanId) {
        setNewPlanId(activePlans[0]._id || activePlans[0].id);
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchSub();
  }, [id]);

  const handleChangePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMsg(null);
    try {
      await AdminApiClient.changeSubscriptionPlan(id, {
        newPlanId,
        reason: changeReason || 'Admin requested plan modification',
      });
      setMsg({ text: 'Subscription plan updated successfully', type: 'success' });
      setChangeReason('');
      await fetchSub();
    } catch (err: any) {
      setMsg({ text: err.message || 'Plan change failed', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvertTrial = async () => {
    setIsSubmitting(true);
    setMsg(null);
    try {
      await AdminApiClient.convertTrial(id, BillingInterval.MONTHLY);
      setMsg({ text: 'Trial converted to active paid subscription', type: 'success' });
      await fetchSub();
    } catch (err: any) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (immediate: boolean) => {
    if (!confirm(`Are you sure you want to cancel this subscription (${immediate ? 'Immediate' : 'At Period End'})?`)) return;
    setIsSubmitting(true);
    setMsg(null);
    try {
      await AdminApiClient.cancelSubscription(id, immediate, 'Cancelled via Platform Admin');
      setMsg({ text: 'Subscription status updated to CANCELLED', type: 'success' });
      await fetchSub();
    } catch (err: any) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReactivate = async () => {
    setIsSubmitting(true);
    setMsg(null);
    try {
      await AdminApiClient.reactivateSubscription(id);
      setMsg({ text: 'Subscription reactivated successfully', type: 'success' });
      await fetchSub();
    } catch (err: any) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700">
        Subscription record not found
      </div>
    );
  }

  const plan = sub.planId as any;

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/subscriptions" className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Subscription Operations</h1>
          <p className="text-sm text-slate-500 font-mono">ID: {sub._id || sub.id}</p>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border text-sm ${
          msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {msg.text}
        </div>
      )}

      {/* Subscription Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{plan?.name || 'Standard Plan'}</h2>
            <p className="text-xs text-slate-400 font-mono">₹{plan?.price || 0} / {sub.billingInterval}</p>
          </div>
          <span className={`text-xs uppercase font-bold px-3 py-1 rounded-full border ${
            sub.status === 'ACTIVE'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : sub.status === 'TRIALING'
              ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {sub.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-medium">Started On:</span>
            <div className="font-semibold text-slate-800 mt-0.5">{new Date(sub.startDate).toLocaleDateString()}</div>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Current Period:</span>
            <div className="font-semibold text-slate-800 mt-0.5">{new Date(sub.currentPeriodEnd).toLocaleDateString()}</div>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Trial Ends:</span>
            <div className="font-semibold text-slate-800 mt-0.5">
              {sub.trialEnd ? new Date(sub.trialEnd).toLocaleDateString() : '—'}
            </div>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Auto-Renew:</span>
            <div className="font-semibold text-slate-800 mt-0.5">{sub.cancelAtPeriodEnd ? 'Cancelling' : 'Active'}</div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
          {sub.status === 'TRIALING' && (
            <button
              onClick={handleConvertTrial}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              Convert Trial to Paid Now
            </button>
          )}

          {sub.status !== 'CANCELLED' ? (
            <>
              <button
                onClick={() => handleCancel(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-all disabled:opacity-50"
              >
                Cancel at Period End
              </button>
              <button
                onClick={() => handleCancel(true)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                Cancel Immediately
              </button>
            </>
          ) : (
            <button
              onClick={handleReactivate}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              Reactivate Subscription
            </button>
          )}
        </div>
      </div>

      {/* Plan Upgrade / Downgrade Form */}
      <form onSubmit={handleChangePlan} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <CreditCard className="w-4 h-4 text-blue-600" />
          Plan Upgrade or Downgrade
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select New Plan Tier
            </label>
            <select
              value={newPlanId}
              onChange={(e) => setNewPlanId(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {plans.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.name} (₹{p.price}/mo)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Reason for Modification
            </label>
            <input
              type="text"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="e.g. Tenant requested branch capacity expansion"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-50"
        >
          {isSubmitting ? 'Processing...' : 'Apply Plan Change'}
        </button>
      </form>

      {/* History Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            Immutable Subscription Event History
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
          {history.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No events logged yet</div>
          ) : (
            history.map((h: any) => (
              <div key={h._id || h.id} className="p-4 flex items-start justify-between text-xs hover:bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {h.event}
                    </span>
                    <span className="text-slate-400">• Actor: {h.actorType}</span>
                  </div>
                  {h.metadata?.reason && (
                    <p className="text-slate-600 mt-1">Reason: {h.metadata.reason}</p>
                  )}
                </div>
                <span className="text-slate-400">{new Date(h.timestamp).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
