'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Download, Sparkles, AlertCircle } from 'lucide-react';
import { customerPortalApi } from '@/lib/api/customer-portal';

export default function CustomerInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [invoice, setInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvoice() {
      if (!orderId) return;
      setIsLoading(true);
      try {
        const res = await customerPortalApi.getInvoiceById(orderId);
        setInvoice(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load invoice');
      } finally {
        setIsLoading(false);
      }
    }
    loadInvoice();
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-slate-200 animate-pulse rounded-lg" />
        <div className="h-96 bg-white animate-pulse rounded-2xl border border-slate-200" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-medium flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error || 'Invoice not found or access denied.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top action bar */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl shadow-xs transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* Printable Invoice Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-8 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                {invoice.tenant?.name?.charAt(0) || 'W'}
              </span>
              <h1 className="text-xl font-extrabold text-slate-900">
                {invoice.tenant?.name || 'Washora Laundry'}
              </h1>
            </div>
            <p className="text-xs text-slate-500 max-w-xs">
              {invoice.branch?.address || invoice.tenant?.address || 'Premium Laundry Care Services'}
            </p>
            {invoice.tenant?.phone && (
              <p className="text-xs text-slate-500 mt-1">Phone: {invoice.tenant.phone}</p>
            )}
          </div>

          <div className="text-left sm:text-right">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-blue-50 text-blue-800 border border-blue-200">
              TAX INVOICE
            </span>
            <p className="font-mono text-base font-bold text-slate-900 mt-2">
              {invoice.invoiceNumber}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Order Ref: <strong className="font-mono text-slate-800">#{invoice.orderNumber}</strong>
            </p>
            <p className="text-xs text-slate-500">
              Date: {new Date(invoice.invoiceDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="py-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Billed To:
            </span>
            <p className="text-sm font-bold text-slate-900">{invoice.customer?.name}</p>
            <p className="text-xs text-slate-500">{invoice.customer?.phone}</p>
            {invoice.customer?.email && (
              <p className="text-xs text-slate-500">{invoice.customer?.email}</p>
            )}
          </div>
          <div className="sm:text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Payment Status:
            </span>
            <span className="inline-block px-2.5 py-0.5 text-xs font-bold rounded-md bg-slate-100 text-slate-800 uppercase">
              {invoice.paymentStatus}
            </span>
          </div>
        </div>

        {/* Items Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                <th className="py-2.5">Item Description</th>
                <th className="py-2.5 text-center">Qty</th>
                <th className="py-2.5 text-right">Unit Price</th>
                <th className="py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(invoice.items || []).map((it: any, idx: number) => (
                <tr key={idx}>
                  <td className="py-3 font-semibold text-slate-800">{it.name}</td>
                  <td className="py-3 text-center text-slate-600">{it.quantity}</td>
                  <td className="py-3 text-right text-slate-600">₹{it.unitPrice}</td>
                  <td className="py-3 text-right font-bold text-slate-900">₹{it.totalPrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total Summary */}
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold">₹{invoice.subtotal}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span className="font-semibold">-₹{invoice.discountAmount}</span>
              </div>
            )}
            {invoice.taxTotal > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>GST Tax:</span>
                <span className="font-semibold">₹{invoice.taxTotal}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
              <span>Grand Total:</span>
              <span>₹{invoice.grandTotal}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-emerald-600">
              <span>Paid Amount:</span>
              <span>₹{invoice.paidAmount}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-amber-600">
              <span>Balance Due:</span>
              <span>₹{invoice.dueAmount}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-slate-100 text-center text-[11px] text-slate-400">
          <p>Thank you for choosing {invoice.tenant?.name || 'Washora'} for your laundry care.</p>
          <p className="mt-0.5">This is a computer generated invoice and requires no signature.</p>
        </div>
      </div>
    </div>
  );
}
