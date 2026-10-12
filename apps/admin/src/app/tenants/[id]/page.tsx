'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminApiClient } from '../../../lib/api';
import { Tenant360Overview } from '@washora/shared';
import {
  Building2,
  ArrowLeft,
  Shield,
  ShieldCheck,
  CreditCard,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Archive,
  RefreshCw,
  LogIn,
  KeyRound,
  Copy,
  Check,
  X,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { useAdminAuth } from '../../../context/AdminAuthContext';

export default function TenantDetail360Page() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { admin: currentAdmin } = useAdminAuth();

  const [data, setData] = useState<Tenant360Overview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionReason, setActionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Reset Password Modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const fetchTenant = async () => {
    setIsLoading(true);
    try {
      const res = await AdminApiClient.getTenant(id);
      setData(res);
    } catch (err: any) {
      setMsg({ text: err.message || 'Failed to load tenant details', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchTenant();
  }, [id]);

  const copyToClipboard = (text: string, key: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleLoginAsShop = async () => {
    setIsImpersonating(true);
    try {
      const res = await AdminApiClient.impersonateTenant(id);
      if (res && res.accessToken) {
        localStorage.setItem('washora_access_token', res.accessToken);
        localStorage.setItem('washora_impersonated', 'true');
        localStorage.setItem('washora_impersonator_name', currentAdmin?.name || currentAdmin?.email || 'Super Admin');
        localStorage.setItem('washora_impersonator_return_url', window.location.href);

        const webUrl = (process.env.NEXT_PUBLIC_WEB_URL
          || (process.env.NODE_ENV === 'production' ? 'https://washora-two.vercel.app' : 'http://localhost:3000')).replace(/\/+$/, '');
        window.open(`${webUrl}/dashboard`, '_blank');
      }
    } catch (err: any) {
      alert(`Failed to start support session: ${err.message}`);
    } finally {
      setIsImpersonating(false);
    }
  };

  const handleResetPassword = async () => {
    setResetLoading(true);
    setResetError(null);
    try {
      const res = await AdminApiClient.resetTenantPassword(id);
      setTempPassword(res.temporaryPassword);
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const handleAction = async (action: 'activate' | 'suspend' | 'cancel' | 'archive' | 'verify') => {
    setIsProcessing(true);
    setMsg(null);
    try {
      if (action === 'verify') {
        await AdminApiClient.verifyTenant(id, !data?.tenant.isVerified);
        setMsg({ text: `Tenant verification status updated`, type: 'success' });
      } else {
        const reason = actionReason || `Admin action: ${action}`;
        if (action === 'activate') await AdminApiClient.activateTenant(id, reason);
        if (action === 'suspend') await AdminApiClient.suspendTenant(id, reason);
        if (action === 'cancel') await AdminApiClient.cancelTenant(id, reason);
        if (action === 'archive') await AdminApiClient.archiveTenant(id, reason);
        setMsg({ text: `Tenant status successfully updated to ${action.toUpperCase()}`, type: 'success' });
        setActionReason('');
      }
      await fetchTenant();
    } catch (err: any) {
      setMsg({ text: err.message || 'Action failed', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700">
        <p className="font-semibold">Tenant Not Found</p>
        <Link href="/tenants" className="text-sm font-semibold underline mt-2 inline-block">
          Return to Tenants
        </Link>
      </div>
    );
  }

  const { tenant, owner, subscription, stats, usage } = data;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/tenants" className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">{tenant.name}</h1>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                tenant.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : tenant.status === 'TRIAL'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {tenant.status}
              </span>
              {tenant.isVerified ? (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Unverified
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Slug: {tenant.slug} • ID: {tenant.id}</p>
          </div>
        </div>

        {/* Action Buttons in Header */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleLoginAsShop}
            disabled={isImpersonating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
          >
            {isImpersonating ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogIn className="w-3.5 h-3.5" />
            )}
            <span>Login as Shop</span>
          </button>

          <button
            onClick={() => {
              setTempPassword(null);
              setResetError(null);
              setResetModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span>Reset Password</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border text-sm ${
          msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {msg.text}
        </div>
      )}

      {/* Grid: 4 Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Branches</span>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.branchesCount}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Staff Members</span>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.staffCount}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Registered Customers</span>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.customersCount}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Lifetime Orders</span>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.ordersCount}</div>
        </div>
      </div>

      {/* 2-Column Details: Owner & Subscription */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Owner & Business Info */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-blue-600" />
            Account & Owner Details
          </h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Business Type:</span>
              <span className="font-medium text-slate-800">{tenant.businessType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Owner Name:</span>
              <span className="font-medium text-slate-800">{owner.name || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Owner Email:</span>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="font-medium text-slate-800">{owner.email || '—'}</span>
                {owner.email && (
                  <button
                    onClick={() => copyToClipboard(owner.email!, 'email')}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    {copiedKey === 'email' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Owner Phone:</span>
              <span className="font-medium text-slate-800">{owner.phone || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Registered On:</span>
              <span className="font-medium text-slate-800">{new Date(tenant.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <CreditCard className="w-4 h-4 text-cyan-600" />
            SaaS Subscription
          </h2>
          {subscription ? (
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Plan Tier:</span>
                <span className="font-bold text-slate-900">{subscription.planName} (₹{subscription.price}/mo)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Billing Status:</span>
                <span className="font-bold text-blue-600 uppercase text-xs">{subscription.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Billing Interval:</span>
                <span className="font-medium text-slate-800">{subscription.billingInterval}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Period End:</span>
                <span className="font-medium text-slate-800">{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
              </div>
              {subscription.trialEnd && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Trial Expiration:</span>
                  <span className="font-medium text-blue-600">{new Date(subscription.trialEnd).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-4">No active subscription plan attached</p>
          )}
        </div>
      </div>

      {/* Plan Limits & Utilization */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
        <h2 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <BarChart3 className="w-4 h-4 text-purple-600" />
          Resource Limits & Utilization
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Branches Progress */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600">Branches</span>
              <span className="text-slate-900">{usage.metrics.branches.current} / {usage.metrics.branches.limit}</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${usage.metrics.branches.percentage >= 100 ? 'bg-red-500' : 'bg-blue-600'}`}
                style={{ width: `${usage.metrics.branches.percentage}%` }}
              />
            </div>
          </div>

          {/* Staff Progress */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600">Staff Members</span>
              <span className="text-slate-900">{usage.metrics.staff.current} / {usage.metrics.staff.limit}</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${usage.metrics.staff.percentage >= 100 ? 'bg-red-500' : 'bg-blue-600'}`}
                style={{ width: `${usage.metrics.staff.percentage}%` }}
              />
            </div>
          </div>

          {/* Customers Progress */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600">Customers</span>
              <span className="text-slate-900">{usage.metrics.customers.current} / {usage.metrics.customers.limit}</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${usage.metrics.customers.percentage >= 100 ? 'bg-red-500' : 'bg-blue-600'}`}
                style={{ width: `${usage.metrics.customers.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Governance & Lifecycle Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
        <h2 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Shield className="w-4 h-4 text-blue-600" />
          Administrative Lifecycle Actions
        </h2>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Audit Reason / Governance Note
          </label>
          <input
            type="text"
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            placeholder="Reason for lifecycle status change (logged to platform audit trail)..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => handleAction('verify')}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{tenant.isVerified ? 'Revoke Verification' : 'Verify Business'}</span>
          </button>

          {tenant.status !== 'ACTIVE' && (
            <button
              onClick={() => handleAction('activate')}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Activate Tenant</span>
            </button>
          )}

          {tenant.status !== 'SUSPENDED' && (
            <button
              onClick={() => handleAction('suspend')}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Suspend Account</span>
            </button>
          )}

          {tenant.status !== 'CANCELLED' && (
            <button
              onClick={() => handleAction('cancel')}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel Account</span>
            </button>
          )}

          {tenant.status !== 'ARCHIVED' && (
            <button
              onClick={() => handleAction('archive')}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Archive className="w-4 h-4" />
              <span>Archive Tenant</span>
            </button>
          )}
        </div>
      </div>

      {/* Reset Password Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <span>Reset Shop Owner Password</span>
              </div>
              <button
                onClick={() => setResetModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Reset access for <strong>{tenant.name}</strong> (Owner:{' '}
              <span className="font-mono text-blue-600">{owner.email}</span>).
            </p>

            {resetError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {resetError}
              </div>
            )}

            {!tempPassword ? (
              <div className="space-y-4 pt-2">
                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-700" />
                    Security Notice
                  </div>
                  <p>
                    A secure, cryptographically generated temporary password will be created and displayed once. The
                    password hash is updated in the database and audited.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setResetModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={resetLoading}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-md shadow-amber-600/20 flex items-center gap-1.5"
                  >
                    {resetLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <KeyRound className="w-3.5 h-3.5" />
                    )}
                    <span>Generate Temporary Password</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                  <div className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Password Successfully Reset
                  </div>
                  <p className="text-xs text-emerald-700">
                    Provide the following temporary password securely to the shop owner:
                  </p>

                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-emerald-300 font-mono text-sm font-bold text-slate-900 select-all">
                    <span>{tempPassword}</span>
                    <button
                      onClick={() => copyToClipboard(tempPassword, 'temp-pass-detail')}
                      className="px-2 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-sans font-bold flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === 'temp-pass-detail' ? (
                        <>
                          <Check className="w-3 h-3" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  Note: This temporary password will not be shown again. The user can log in and change their password.
                </p>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setResetModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
