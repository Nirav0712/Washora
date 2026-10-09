'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminApiClient } from '../../../lib/api';
import { CreditCard, ArrowLeft, Filter } from 'lucide-react';

export default function BillingPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const res = await AdminApiClient.listPayments({ page, limit: 15 });
      setPayments(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center gap-3">
        <Link href="/billing" className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">SaaS Platform Payments</h1>
          <p className="text-sm text-slate-500 mt-0.5">Payment receipts and settlement records</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-6">Payment #</th>
                <th className="py-3.5 px-6">Tenant</th>
                <th className="py-3.5 px-6">Amount</th>
                <th className="py-3.5 px-6">Gateway Provider</th>
                <th className="py-3.5 px-6">Provider Reference</th>
                <th className="py-3.5 px-6">Paid Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No payment records found
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id || p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">{p.paymentNumber}</td>
                    <td className="py-4 px-6 font-semibold text-slate-800">{p.tenantId?.name || '—'}</td>
                    <td className="py-4 px-6 font-bold text-emerald-600">₹{p.amount.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-6 text-xs text-slate-600 font-medium">{p.provider}</td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-400">{p.providerPaymentId || '—'}</td>
                    <td className="py-4 px-6 text-xs text-slate-600">
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}
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
