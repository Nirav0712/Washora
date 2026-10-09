'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowRight, Download, Printer } from 'lucide-react';
import { customerPortalApi } from '@/lib/api/customer-portal';

export default function CustomerInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvoices() {
      try {
        const res = await customerPortalApi.getInvoices();
        setInvoices(res || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load invoices.');
      } finally {
        setIsLoading(false);
      }
    }
    loadInvoices();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Invoices & Receipts
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Download and print GST tax invoices for all completed and processed orders
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
      ) : invoices.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No invoices available</p>
          <p className="text-xs text-slate-400 mt-0.5">Invoices are generated upon order processing.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="divide-y divide-slate-100">
            {invoices.map((inv) => (
              <div key={inv.orderId} className="p-4 sm:p-5 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {inv.invoiceNumber}
                      </span>
                      <span className="text-xs text-slate-500">
                        (Order #{inv.orderNumber})
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Date: {new Date(inv.invoiceDate).toLocaleDateString()} • {inv.branchName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-black text-slate-900">₹{inv.totalAmount}</p>
                    <span className="text-[11px] font-semibold text-slate-500">{inv.paymentStatus}</span>
                  </div>

                  <Link
                    href={`/portal/invoices/${inv.orderId}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all border border-blue-200"
                  >
                    <span>View / Print</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
