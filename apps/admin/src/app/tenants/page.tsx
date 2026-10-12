'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminApiClient } from '../../lib/api';
import {
  Building2,
  Search,
  Filter,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShieldAlert,
  LogIn,
  KeyRound,
  Copy,
  Check,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  X,
} from 'lucide-react';
import { TenantStatus } from '@washora/shared';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function TenantsListPage() {
  const { admin: currentAdmin } = useAdminAuth();
  const [tenants, setTenants] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Copy feedback state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Reset Password Modal state
  const [resetModalData, setResetModalData] = useState<{
    tenantName: string;
    ownerEmail: string;
    temporaryPassword?: string;
    tenantId: string;
    isOpen: boolean;
    loading: boolean;
    error?: string;
  } | null>(null);

  // Impersonation loading state
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      const res = await AdminApiClient.listTenants({
        page,
        limit,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setTenants(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTenants();
  };

  const copyToClipboard = (text: string, key: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleLoginAsShop = async (tenant: any) => {
    setImpersonatingId(tenant.id);
    try {
      const res = await AdminApiClient.impersonateTenant(tenant.id);
      if (res && res.accessToken) {
        // Store in localStorage for the web app domain / origin
        // If web is on localhost:3000 and admin on localhost:3002, we can set localStorage and open localhost:3000
        localStorage.setItem('washora_access_token', res.accessToken);
        localStorage.setItem('washora_impersonated', 'true');
        localStorage.setItem('washora_impersonator_name', currentAdmin?.name || currentAdmin?.email || 'Super Admin');
        localStorage.setItem('washora_impersonator_return_url', window.location.href);

        // Open shop dashboard
        const webUrl = (process.env.NEXT_PUBLIC_WEB_URL
          || (process.env.NODE_ENV === 'production' ? 'https://washora-two.vercel.app' : 'http://localhost:3000')).replace(/\/+$/, '');
        window.open(`${webUrl}/dashboard`, '_blank');
      }
    } catch (err: any) {
      alert(`Failed to start support session: ${err.message || 'Unauthorized or server error'}`);
    } finally {
      setImpersonatingId(null);
    }
  };

  const openResetPasswordModal = (tenant: any) => {
    setResetModalData({
      tenantId: tenant.id,
      tenantName: tenant.name,
      ownerEmail: tenant.ownerEmail || tenant.email,
      isOpen: true,
      loading: false,
    });
  };

  const handleConfirmResetPassword = async () => {
    if (!resetModalData) return;
    setResetModalData((prev: any) => ({ ...prev, loading: true, error: undefined }));
    try {
      const res = await AdminApiClient.resetTenantPassword(resetModalData.tenantId);
      setResetModalData((prev: any) => ({
        ...prev,
        loading: false,
        temporaryPassword: res.temporaryPassword,
      }));
    } catch (err: any) {
      setResetModalData((prev: any) => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to reset password',
      }));
    }
  };

  const handleToggleStatus = async (tenant: any) => {
    const isSuspended = tenant.status === 'SUSPENDED';
    const action = isSuspended ? 'activate' : 'suspend';
    const confirmMsg = isSuspended
      ? `Activate ${tenant.name}? The shop owner and staff will be able to log in.`
      : `Suspend ${tenant.name}? The shop will immediately lose access to the platform.`;

    if (window.confirm(confirmMsg)) {
      try {
        if (isSuspended) {
          await AdminApiClient.activateTenant(tenant.id, 'Admin activated via tenants list');
        } else {
          await AdminApiClient.suspendTenant(tenant.id, 'Admin suspended via tenants list');
        }
        await fetchTenants();
      } catch (err: any) {
        alert(`Status update failed: ${err.message}`);
      }
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Laundry Tenants & Shops</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Super Admin direct access, credential management, partner assignment & subscription oversight
          </p>
        </div>

        <Link
          href="/tenants/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Provision Tenant</span>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by business name, slug, owner email, phone, or partner..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-44 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">All Statuses</option>
            {Object.values(TenantStatus).map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">Shop / Tenant</th>
                <th className="py-3.5 px-5">Owner Credentials</th>
                <th className="py-3.5 px-4">Partner</th>
                <th className="py-3.5 px-5">Plan & Trial</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Registered</th>
                <th className="py-3.5 px-5 text-right">Direct Access & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="inline-block w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs mt-2 font-medium">Loading tenants data...</p>
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No tenants found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or status filter</p>
                  </td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Shop / Tenant */}
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{t.name}</span>
                        {t.isVerified && (
                          <span title="Verified Shop">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                        <span>{t.slug}</span>
                        <span>•</span>
                        <button
                          onClick={() => copyToClipboard(t.id, `tid-${t.id}`)}
                          className="hover:text-blue-600 transition-colors flex items-center gap-0.5"
                          title="Click to copy Tenant ID"
                        >
                          {copiedKey === `tid-${t.id}` ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-300 hover:text-slate-600" />
                          )}
                          <span className="truncate max-w-[80px]">{t.id}</span>
                        </button>
                      </div>
                    </td>

                    {/* Owner Credentials */}
                    <td className="py-4 px-5">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.ownerName || '—'}</span>
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="font-mono">{t.ownerEmail || t.email || '—'}</span>
                        {(t.ownerEmail || t.email) && (
                          <button
                            onClick={() => copyToClipboard(t.ownerEmail || t.email, `email-${t.id}`)}
                            className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors"
                            title="Copy login email"
                          >
                            {copiedKey === `email-${t.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                      {(t.ownerPhone || t.phone) && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{t.ownerPhone || t.phone}</span>
                        </div>
                      )}
                    </td>

                    {/* Partner Assignment */}
                    <td className="py-4 px-4">
                      {t.partnerCode || t.partnerId ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold font-mono">
                          {t.partnerCode || 'ASSIGNED'}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Direct SaaS</span>
                      )}
                    </td>

                    {/* Plan & Trial */}
                    <td className="py-4 px-5">
                      <div className="font-medium text-slate-800 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                          {t.planName || 'Standard'}
                        </span>
                      </div>
                      {t.trialEnd ? (
                        <div className="text-[11px] text-blue-600 mt-1 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Trial ends: {new Date(t.trialEnd).toLocaleDateString()}</span>
                        </div>
                      ) : t.currentPeriodEnd ? (
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Renews: {new Date(t.currentPeriodEnd).toLocaleDateString()}</span>
                        </div>
                      ) : null}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span
                        className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${t.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : t.status === 'TRIAL'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : t.status === 'PAST_DUE'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : t.status === 'SUSPENDED'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                      >
                        {t.status}
                      </span>
                    </td>

                    {/* Registered Date */}
                    <td className="py-4 px-4">
                      <div className="text-xs text-slate-700">
                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
                      </div>
                      {t.ownerLastLogin && (
                        <div className="text-[10px] text-slate-400 mt-0.5" title="Owner last login">
                          Last: {new Date(t.ownerLastLogin).toLocaleDateString()}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Login as Shop */}
                        <button
                          onClick={() => handleLoginAsShop(t)}
                          disabled={impersonatingId === t.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                          title="Open secure support session into this shop's dashboard"
                        >
                          {impersonatingId === t.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <LogIn className="w-3.5 h-3.5" />
                          )}
                          <span>Login as Shop</span>
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => openResetPasswordModal(t)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-600 text-xs transition-colors"
                          title="Reset Shop Owner Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {/* Toggle Suspend/Activate */}
                        <button
                          onClick={() => handleToggleStatus(t)}
                          className={`p-1.5 rounded-lg text-xs transition-colors ${t.status === 'SUSPENDED'
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-700'
                            }`}
                          title={t.status === 'SUSPENDED' ? 'Activate Shop' : 'Suspend Shop'}
                        >
                          {t.status === 'SUSPENDED' ? (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* View 360 */}
                        <Link
                          href={`/tenants/${t.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                          title="View Complete 360° Tenant Dossier"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline">360°</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800">{tenants.length}</strong> of{' '}
            <strong className="text-slate-800">{total}</strong> total registered shops
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      {resetModalData?.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <span>Reset Shop Owner Password</span>
              </div>
              <button
                onClick={() => setResetModalData(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Reset access for <strong>{resetModalData.tenantName}</strong> (Login Email:{' '}
              <span className="font-mono text-blue-600">{resetModalData.ownerEmail}</span>).
            </p>

            {resetModalData.error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {resetModalData.error}
              </div>
            )}

            {!resetModalData.temporaryPassword ? (
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
                    onClick={() => setResetModalData(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmResetPassword}
                    disabled={resetModalData.loading}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-md shadow-amber-600/20 flex items-center gap-1.5"
                  >
                    {resetModalData.loading ? (
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
                    <span>{resetModalData.temporaryPassword}</span>
                    <button
                      onClick={() =>
                        copyToClipboard(resetModalData.temporaryPassword!, 'temp-pass')
                      }
                      className="px-2 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-sans font-bold flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === 'temp-pass' ? (
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
                    onClick={() => setResetModalData(null)}
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
