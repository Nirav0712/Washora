'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminApiClient } from '../../lib/api';
import { Receipt, DollarSign, CreditCard, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

export default function BillingOverviewPage() {
  const [overview, setOverview] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      AdminApiClient.getBillingOverview(),
      AdminApiClient.listInvoices({ limit: 5 }),
      AdminApiClient.listPayments({ limit: 5 }),
    ])
      .then(([ov, inv, pay]) => {
        setOverview(ov);
        setInvoices(inv.items || []);
        setPayments(pay.items || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">SaaS Platform Billing & Revenue</h1>
          <p className="text-sm text-slate-500 mt-0.5">Separate platform SaaS subscription invoices, payments, and gateway webhooks</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/billing/invoices"
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold"
          >
            All Invoices
          </Link>
          <Link
            href="/billing/payments"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20"
          >
            All Payments
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase">Platform Collected Revenue</span>
          <div className="text-3xl font-black text-slate-900 mt-3">
            ₹{(overview?.totalRevenue || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-400 mt-2">{overview?.totalPayments || 0} Successful Transactions</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase">Outstanding Invoices</span>
          <div className="text-3xl font-black text-amber-600 mt-3">
            ₹{(overview?.totalOutstanding || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-400 mt-2">{overview?.openInvoicesCount || 0} Invoices Pending Settlement</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Invoices Issued</span>
          <div className="text-3xl font-black text-slate-900 mt-3">{overview?.totalInvoices || 0}</div>
          <p className="text-xs text-slate-400 mt-2">Cumulative SaaS Billing Invoices</p>
        </div>
      </div>

      {/* Invoices & Payments Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Invoices */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              Recent SaaS Invoices
            </h2>
            <Link href="/billing/invoices" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {invoices.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">No invoices issued yet</div>
            ) : (
              invoices.map((inv) => (
                <div key={inv._id || inv.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/50">
                  <div>
                    <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                    <p className="text-slate-500 mt-0.5">{inv.tenantId?.name || 'Tenant'}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">₹{inv.total.toLocaleString('en-IN')}</span>
                    <div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Recent SaaS Payments
            </h2>
            <Link href="/billing/payments" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {payments.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">No payment transactions recorded yet</div>
            ) : (
              payments.map((p) => (
                <div key={p._id || p.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/50">
                  <div>
                    <span className="font-mono font-bold text-slate-900">{p.paymentNumber}</span>
                    <p className="text-slate-500 mt-0.5">{p.tenantId?.name || 'Tenant'}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600">₹{p.amount.toLocaleString('en-IN')}</span>
                    <div>
                      <span className="text-[10px] font-mono text-slate-400">{p.provider}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
