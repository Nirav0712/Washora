'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { customerPortalApi } from '@/lib/api/customer-portal';

export default function CustomerPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPayments() {
      try {
        const res = await customerPortalApi.getPayments();
        setPayments(res.items || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load payments.');
      } finally {
        setIsLoading(false);
      }
    }
    loadPayments();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Payment Transactions
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          History of all payments made towards your laundry orders
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white animate-pulse rounded-2xl border border-slate-200" />
          ))}
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
          {error}
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
          <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No payment records found</p>
          <p className="text-xs text-slate-400 mt-0.5">Your payment receipts will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="divide-y divide-slate-100">
            {payments.map((p) => (
              <div key={p.id || p.paymentNumber} className="p-4 sm:p-5 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {p.paymentNumber || 'Receipt'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                        {p.method}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(p.createdAt).toLocaleDateString()} at{' '}
                      {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-base font-black text-slate-900">₹{p.amount}</p>
                  <span className="text-[11px] font-bold text-emerald-600">
                    {p.status || 'COMPLETED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
