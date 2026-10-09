'use client';

import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  Building2,
  Users,
  TrendingUp,
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  Percent,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface PartnerClient {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  phone?: string;
  email?: string;
  status: string;
  planName: string;
  subscriptionStatus: string;
  renewalDate?: string;
  createdAt: string;
}

interface PartnerDashboardData {
  partner: {
    id: string;
    name: string;
    companyName?: string;
    code: string;
    email: string;
    commissionRate: number;
  };
  metrics: {
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    monthlyRevenue: number;
    commissionRate: number;
    estimatedCommission: number;
  };
  tenants: PartnerClient[];
}

export default function PartnerDashboardPage() {
  const { token, admin } = useAdminAuth();
  const [data, setData] = useState<PartnerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Client Onboarding Modal
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [onboardError, setOnboardError] = useState<string | null>(null);
  const [onboardForm, setOnboardForm] = useState({
    shopName: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    businessType: 'LAUNDRY',
    password: '',
  });

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/partner/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const resData = await res.json();
      if (resData.success) {
        setData(resData.data);
      } else {
        setError(resData.message || 'Failed to load partner dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching partner data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboard();
    }
  }, [token]);

  const handleOnboardClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setOnboardError(null);

    try {
      const res = await fetch('/api/partner/onboard-client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(onboardForm),
      });
      const resData = await res.json();
      if (resData.success) {
        setIsOnboardModalOpen(false);
        setOnboardForm({
          shopName: '',
          ownerName: '',
          ownerEmail: '',
          ownerPhone: '',
          businessType: 'LAUNDRY',
          password: '',
        });
        fetchDashboard();
      } else {
        setOnboardError(resData.message || 'Failed to onboard client');
      }
    } catch (err: any) {
      setOnboardError(err.message || 'Network error during onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClients = (data?.tenants || []).filter((client) => {
    return (
      client.name?.toLowerCase().includes(search.toLowerCase()) ||
      client.email?.toLowerCase().includes(search.toLowerCase()) ||
      client.slug?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Partner Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-600/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-cyan-100">
                Partner Portal
              </span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/20 text-white">
                {data?.partner?.code || 'PARTNER'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {data?.partner?.companyName || data?.partner?.name || 'Authorized Sales Partner'}
            </h1>
            <p className="text-sm text-blue-100 mt-1 max-w-xl">
              Manage your assigned laundry shop clients, onboard new locations, and track sales commission payouts.
            </p>
          </div>

          <button
            onClick={() => setIsOnboardModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-blue-700 font-bold text-sm shadow-lg hover:bg-blue-50 transition shrink-0"
          >
            <Plus className="w-5 h-5" />
            Onboard New Laundry Shop
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Clients</p>
            <p className="text-2xl font-black text-slate-900">{data?.metrics?.totalTenants || 0}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Subscriptions</p>
            <p className="text-2xl font-black text-slate-900">{data?.metrics?.activeTenants || 0}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Free Trials</p>
            <p className="text-2xl font-black text-slate-900">{data?.metrics?.trialTenants || 0}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Est. Commission ({data?.metrics?.commissionRate || 15}%)
            </p>
            <p className="text-2xl font-black text-cyan-700">
              ₹{(data?.metrics?.estimatedCommission || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Scoped Client List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">Your Assigned Laundry Clients</h2>
            <p className="text-xs text-slate-500">
              Strictly isolated under your partner account scope. Only your onboarded clients are visible.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search assigned shops..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
            <p className="text-sm">Loading assigned clients...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-base font-semibold text-slate-700">No assigned clients found</p>
            <p className="text-sm mt-1">Use the "Onboard New Laundry Shop" button to register your first client.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4">Shop Name & Type</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Plan & Tier</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4">Onboarded Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-bold text-slate-900">{client.name}</p>
                        <span className="text-[11px] font-semibold text-blue-600 uppercase">
                          {client.businessType || 'LAUNDRY'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-slate-800 text-xs font-medium">{client.email || '—'}</p>
                        <p className="text-slate-400 text-xs">{client.phone || '—'}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                        {client.planName || 'Free Trial'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {client.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : client.status === 'TRIAL' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
                          <Clock className="w-3 h-3" />
                          Trial
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {client.status}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-500 font-mono">
                      {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Onboard Client Modal */}
      {isOnboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Onboard Laundry Client</h3>
                <p className="text-xs text-slate-500">
                  Provision a new laundry shop under partner code: <span className="font-mono font-bold text-blue-600">{data?.partner?.code}</span>
                </p>
              </div>
              <button
                onClick={() => setIsOnboardModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {onboardError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{onboardError}</span>
              </div>
            )}

            <form onSubmit={handleOnboardClient} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Shop / Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Cleaners & Steam Hub"
                  value={onboardForm.shopName}
                  onChange={(e) => setOnboardForm({ ...onboardForm, shopName: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Owner Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anand Kumar"
                    value={onboardForm.ownerName}
                    onChange={(e) => setOnboardForm({ ...onboardForm, ownerName: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Business Type</label>
                  <select
                    value={onboardForm.businessType}
                    onChange={(e) => setOnboardForm({ ...onboardForm, businessType: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="LAUNDRY">Laundry & Wash</option>
                    <option value="DRY_CLEANING">Dry Cleaning</option>
                    <option value="GARMENT_CARE">Complete Garment Care</option>
                    <option value="IRONING">Steam Ironing Service</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Owner Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="owner@royalcleaners.com"
                    value={onboardForm.ownerEmail}
                    onChange={(e) => setOnboardForm({ ...onboardForm, ownerEmail: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Owner Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 99000 11111"
                    value={onboardForm.ownerPhone}
                    onChange={(e) => setOnboardForm({ ...onboardForm, ownerPhone: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Initial Password</label>
                <input
                  type="password"
                  placeholder="Defaults to Washora@123456 if blank"
                  value={onboardForm.password}
                  onChange={(e) => setOnboardForm({ ...onboardForm, password: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOnboardModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-md shadow-blue-600/20"
                >
                  {isSubmitting ? 'Onboarding...' : 'Onboard Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
