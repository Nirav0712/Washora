'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  CreditCard,
  FileText,
  Share2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { customerPortalApi } from '@/lib/api/customer-portal';

export default function CustomerOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) return;
      setIsLoading(true);
      try {
        const res = await customerPortalApi.getOrderById(orderId);
        setOrder(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    }
    loadOrder();
  }, [orderId]);

  const handleCopyTrackingLink = () => {
    if (order?.trackingUrl) {
      navigator.clipboard.writeText(window.location.origin + order.trackingUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-slate-200 animate-pulse rounded-lg" />
        <div className="h-48 bg-white animate-pulse rounded-2xl border border-slate-200" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Orders</span>
        </button>
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-medium flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error || 'Order not found or access denied.'}</p>
        </div>
      </div>
    );
  }

  const steps = order.timelineSteps || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                Order #{order.orderNumber}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                {order.customerFacingStatus || order.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleDateString()} • {order.branchName || 'Main Branch'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {order.trackingUrl && (
            <button
              onClick={handleCopyTrackingLink}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200"
            >
              <Copy className="w-3.5 h-3.5 text-blue-600" />
              <span>{copiedLink ? 'Copied Link!' : 'Share Tracking Link'}</span>
            </button>
          )}

          <Link
            href={`/portal/invoices/${order.id}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all border border-blue-200"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>View Invoice</span>
          </Link>
        </div>
      </div>

      {/* Visual Tracking Progress Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Live Processing Timeline</span>
        </h2>

        <div className="relative">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {steps.map((step: any, index: number) => {
              return (
                <div
                  key={step.key}
                  className={`relative p-4 rounded-xl border transition-all ${
                    step.isCompleted
                      ? 'bg-blue-50/50 border-blue-200 text-blue-950'
                      : step.isCurrent
                      ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20 text-amber-950'
                      : 'bg-slate-50 border-slate-200/80 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Step {index + 1}
                    </span>
                    {step.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    ) : step.isCurrent ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    )}
                  </div>
                  <p className="text-xs font-bold">{step.label}</p>
                  {step.timestamp && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Garments list + Payment & Logistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Garments Breakdown (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            <span>Garments in this Order ({order.items?.length || 0})</span>
          </h2>

          <div className="divide-y divide-slate-100">
            {(order.items || []).map((item: any, idx: number) => (
              <div key={idx} className="py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {item.productNameSnapshot || item.name || 'Garment Item'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Service: <span className="text-slate-600 font-medium">{item.serviceNameSnapshot || 'Laundry'}</span>
                    {item.categoryNameSnapshot && ` • ${item.categoryNameSnapshot}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800">
                    {item.quantity} × ₹{item.unitPrice}
                  </p>
                  <p className="text-xs font-extrabold text-blue-600 mt-0.5">
                    ₹{item.lineTotal || (item.quantity * item.unitPrice)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Special Instructions / Notes */}
          {order.notes && (
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
              <strong className="text-slate-800">Order Notes:</strong> {order.notes}
            </div>
          )}
        </div>

        {/* Right Summary Column */}
        <div className="space-y-6">
          {/* Payment Summary Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Payment Summary</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold">₹{order.subtotal}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span className="font-semibold">-₹{order.discountAmount}</span>
                </div>
              )}
              {order.taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Taxes (GST)</span>
                  <span className="font-semibold">₹{order.taxAmount}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-black text-slate-900">
                <span>Total</span>
                <span>₹{order.grandTotal}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-emerald-600">
                <span>Paid</span>
                <span>₹{order.paidAmount}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-amber-600">
                <span>Balance Due</span>
                <span>₹{order.dueAmount}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="block text-[11px] text-slate-400">Payment Status</span>
              <span className="text-xs font-bold text-slate-800">{order.paymentStatus}</span>
            </div>
          </div>

          {/* Pickup & Delivery Status */}
          {(order.pickup || order.delivery) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-cyan-600" />
                <span>Logistics Schedule</span>
              </h3>

              {order.pickup && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                    <span>Pickup Request</span>
                    <span className="text-blue-600">{order.pickup.status}</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Date: {order.pickup.scheduledDate}
                  </p>
                </div>
              )}

              {order.delivery && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                    <span>Delivery Request</span>
                    <span className="text-cyan-600">{order.delivery.status}</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Date: {order.delivery.scheduledDate}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
