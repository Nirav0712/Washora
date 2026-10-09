'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminApiClient } from '../../../lib/api';
import { Receipt, ArrowLeft, Filter, PlusCircle } from 'lucide-react';
import { BillingInvoiceStatus } from '@washora/shared';

export default function BillingInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await AdminApiClient.listInvoices({
        page,
        limit: 15,
        status: statusFilter || undefined,
      });
      setInvoices(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, statusFilter]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/billing" className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">SaaS Platform Invoices</h1>
            <p className="text-sm text-slate-500 mt-0.5">Ledger of platform subscription billing invoices</p>
          </div>
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
            <option value="">All Invoice Statuses</option>
            {Object.values(BillingInvoiceStatus).map((st) => (
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
                <th className="py-3.5 px-6">Invoice #</th>
                <th className="py-3.5 px-6">Tenant</th>
                <th className="py-3.5 px-6">Billing Period</th>
                <th className="py-3.5 px-6">Amount</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No billing invoices recorded yet
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv._id || inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-4 px-6 font-semibold text-slate-800">{inv.tenantId?.name || '—'}</td>
                    <td className="py-4 px-6 text-xs text-slate-600">
                      {new Date(inv.billingPeriodStart).toLocaleDateString()} → {new Date(inv.billingPeriodEnd).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">₹{inv.total.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${
                        inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600">{new Date(inv.dueAt).toLocaleDateString()}</td>
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
