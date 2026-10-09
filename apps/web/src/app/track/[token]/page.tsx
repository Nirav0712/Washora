'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  CreditCard,
  Phone,
  AlertCircle,
  Package,
} from 'lucide-react';
import { customerTrackingApi, PublicOrderTracking } from '@/lib/api/customer-tracking';

export default function PublicOrderTrackingPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<PublicOrderTracking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTracking() {
      if (!token) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await customerTrackingApi.getTrackingByToken(token);
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Tracking link is invalid, expired, or revoked.');
      } finally {
        setIsLoading(false);
      }
    }
    loadTracking();
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Locating your laundry order...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Tracking Link Expired</h1>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            {error || 'This order tracking link is no longer valid. If you believe this is an error, please log into your customer portal or contact the shop.'}
          </p>
          <div className="mt-6">
            <Link
              href="/portal/login"
              className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
            >
              Go to Customer Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#172033] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-black text-lg shadow-sm">
              {data.tenantName ? data.tenantName.charAt(0).toUpperCase() : 'W'}
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900">
                {data.tenantName || 'Washora Laundry Care'}
              </h1>
              <p className="text-[11px] text-slate-400">Live Garment Tracking</p>
            </div>
          </div>

          <Link
            href="/portal/login"
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            Customer Login
          </Link>
        </div>

        {/* Order Status Banner */}
        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-blue-500/15">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur">
                Order Reference
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-mono mt-1">
                #{data.orderNumber}
              </h2>
              <p className="text-xs text-blue-100 font-medium mt-0.5">
                Placed on {new Date(data.placedAt).toLocaleDateString()}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-3 sm:text-right border border-white/15">
              <span className="text-[10px] uppercase font-bold text-blue-200 block">Current Status</span>
              <span className="text-base sm:text-lg font-black uppercase tracking-wide">
                {data.overallStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Live Timeline Steps */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Garment Lifecycle</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {data.steps.map((step, idx) => (
              <div
                key={step.key}
                className={`p-3.5 rounded-xl border transition-all ${
                  step.isCompleted
                    ? 'bg-blue-50/60 border-blue-200 text-blue-950'
                    : step.isCurrent
                    ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20 text-amber-950'
                    : 'bg-slate-50 border-slate-200/70 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider">
                    Step {idx + 1}
                  </span>
                  {step.isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  ) : step.isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                  )}
                </div>
                <p className="text-xs font-bold leading-snug">{step.label}</p>
                {step.timestamp && (
                  <p className="text-[9px] text-slate-500 mt-1">
                    {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Order Details & Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Garments Count Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span>Garments Summary</span>
            </h4>
            <p className="text-lg font-black text-slate-900">
              {data.itemsSummary?.itemCount ?? 0} Items
            </p>
            <div className="mt-3 space-y-1.5 divide-y divide-slate-100">
              {(data.itemsSummary?.items || []).map((it, i) => (
                <div key={i} className="pt-1.5 flex justify-between text-xs text-slate-600 font-medium">
                  <span>{it.name}</span>
                  <span className="font-bold text-slate-900">{it.quantity}x</span>
                </div>
              ))}
            </div>
          </div>

          {/* Amount Due Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>Payment Summary</span>
              </h4>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Total Amount</span>
                  <span className="font-bold text-slate-900">₹{data.financialSummary?.grandTotal}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Paid Amount</span>
                  <span>₹{data.financialSummary?.paidAmount}</span>
                </div>
                <div className="flex justify-between text-amber-600 font-bold">
                  <span>Balance Due</span>
                  <span>₹{data.financialSummary?.dueAmount}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">Payment Status:</span>
              <span className="font-bold text-slate-800 uppercase">
                {data.financialSummary?.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 py-4">
          <p>Protected by Washora Cryptographic Tracking Token • Customer privacy guaranteed</p>
        </div>
      </div>
    </div>
  );
}
