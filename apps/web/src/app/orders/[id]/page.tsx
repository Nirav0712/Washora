'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@washora/shared';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Clock,
  Printer,
  CreditCard,
  Send,
  Sparkles,
  QrCode,
  AlertOctagon,
  CheckCircle2,
} from 'lucide-react';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { orders, updateOrderStatus, recordPayment, cancelOrder } = useApp();

  const orderId = params?.id as string;
  const order =
    orders.find(
      (o) =>
        o.id === orderId ||
        o.orderNumber.replace('#', '').toLowerCase() === orderId?.toLowerCase()
    ) || orders[0];

  const [paymentInput, setPaymentInput] = useState<number>(order ? order.dueAmount : 0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>(PaymentMethod.UPI);
  const [payRef, setPayRef] = useState<string>('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('Customer requested cancellation');

  if (!order) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-sm text-slate-500">Order not found</p>
        <Link href="/orders">
          <Button variant="outline" size="sm">
            ← Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  const allStatuses: { status: OrderStatus; label: string }[] = [
    { status: OrderStatus.RECEIVED, label: 'Order Received & Tagged' },
    { status: OrderStatus.PROCESSING, label: 'Washing & Solvent Cycle' },
    { status: OrderStatus.QC, label: 'Quality Check & Steam Finish' },
    { status: OrderStatus.READY, label: 'Ready for Pickup / Delivery' },
    { status: OrderStatus.DELIVERED, label: 'Delivered to Customer' },
  ];

  const currentStatusIndex = allStatuses.findIndex((s) => s.status === order.orderStatus);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/orders">
            <button className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-slate-900 shadow-sm transition-all">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                {order.orderNumber}
              </h1>
              <StatusPill status={order.orderStatus} size="md" />
              {order.express && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold">
                  ⚡ Express
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary-600" />
              Expected Delivery: <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(order.expectedDeliveryDate)}</span>
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="glass"
            size="sm"
            leftIcon={<QrCode className="w-4 h-4" />}
            onClick={() => setShowTagsModal(true)}
          >
            Garment Tags
          </Button>

          <Button
            variant="glass"
            size="sm"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={() => window.print()}
          >
            Print Bill
          </Button>

          {/* Quick next status update button */}
          {currentStatusIndex >= 0 && currentStatusIndex < allStatuses.length - 1 && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Sparkles className="w-4 h-4" />}
              onClick={() => updateOrderStatus(order.id, allStatuses[currentStatusIndex + 1].status)}
            >
              Mark as {allStatuses[currentStatusIndex + 1].status}
            </Button>
          )}

          {order.orderStatus !== OrderStatus.CANCELLED && order.orderStatus !== OrderStatus.DELIVERED && (
            <Button
              variant="ghost"
              size="xs"
              className="text-rose-500 hover:bg-rose-50"
              onClick={() => setShowCancelDialog(true)}
            >
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Left Items + Customer & Right Timeline + Payment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Customer & Order Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Card */}
          <GlassCard className="p-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Customer Information
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {order.customer?.name || 'Walk-in Customer'}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {order.customer?.phone || '-'}
                  </p>
                  {order.customer?.address && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {order.customer.address}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/91${(order.customer?.phone || '').replace(/[^0-9]/g, '')}?text=Hello ${encodeURIComponent(
                    order.customer?.name || 'Customer'
                  )}, your Washora laundry order ${order.orderNumber} is currently in ${order.orderStatus} status.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3 h-3" />
                  <span>WhatsApp Update</span>
                </a>
              </div>
            </div>
          </GlassCard>

          {/* Order Items Breakdown */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Order Items ({order.items.length})
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                Total Garments: {order.itemCount}
              </span>
            </div>

            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-center text-lg">
                      👔
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.productName}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {item.categoryName} · {item.tier} · {item.quantity} × {formatCurrency(item.unitPrice)}
                      </p>
                      {item.notes && (
                        <span className="text-[10px] text-primary-600 font-medium block mt-0.5">
                          Garment Notes: {item.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right font-bold text-xs font-sans text-slate-900 dark:text-white">
                    {formatCurrency(item.subtotal)}
                  </div>
                </div>
              ))}
            </div>

            {/* Special Instructions / Notes */}
            {order.notes && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 text-xs">
                <span className="font-bold text-amber-800 dark:text-amber-300">Special Notes: </span>
                <span className="text-amber-900 dark:text-amber-200">{order.notes}</span>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right Col: Subtle Glass Timeline & Payment Breakdown */}
        <div className="space-y-6">
          {/* Glass Timeline */}
          <GlassCard className="p-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Order Timeline & Progress
            </h2>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800">
              {allStatuses.map((s, index) => {
                const isPassed = index < currentStatusIndex;
                const isCurrent = index === currentStatusIndex;

                return (
                  <div key={s.status} className="relative group">
                    {/* Bullet dot */}
                    <div
                      className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        isPassed
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : isCurrent
                          ? 'bg-primary-600 border-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-950'
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isPassed && <span className="text-[9px] font-bold">✓</span>}
                      {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>

                    <div className="text-xs">
                      <p
                        className={`font-bold ${
                          isCurrent
                            ? 'text-primary-600 dark:text-primary-400'
                            : isPassed
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-400'
                        }`}
                      >
                        {s.label}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {isPassed
                          ? 'Completed'
                          : isCurrent
                          ? 'In Progress · Operational Station'
                          : 'Pending queue'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Payment Breakdown Card */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Payment Breakdown
              </h2>
              <StatusPill status={order.paymentStatus} size="sm" />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  {formatCurrency(order.subtotal)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span className="font-semibold font-mono">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>GST Tax ({order.taxRate}%)</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  {formatCurrency(order.tax)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between font-bold text-sm">
                <span className="text-slate-900 dark:text-white">Total</span>
                <span className="text-slate-900 dark:text-white font-sans">
                  {formatCurrency(order.total)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                <span>Paid Amount</span>
                <span className="font-bold font-mono">{formatCurrency(order.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-rose-600 font-bold">
                <span>Balance Due</span>
                <span className="font-mono">{formatCurrency(order.dueAmount)}</span>
              </div>
            </div>

            {order.dueAmount > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setPaymentInput(order.dueAmount);
                    setShowPayModal(true);
                  }}
                >
                  Collect Due ({formatCurrency(order.dueAmount)})
                </Button>
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Collect Balance Modal */}
      <Modal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        title="Collect Outstanding Balance"
        description={`Remaining balance: ${formatCurrency(order.dueAmount)}`}
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowPayModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                recordPayment(order.id, paymentInput, payMethod, payRef);
                setShowPayModal(false);
              }}
            >
              Record Payment
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[PaymentMethod.UPI, PaymentMethod.CASH, PaymentMethod.CARD].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPayMethod(m)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    payMethod === m
                      ? 'border-primary-600 bg-primary-50 text-primary-600 dark:bg-primary-950'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Amount (₹)"
            type="number"
            value={paymentInput}
            onChange={(e) => setPaymentInput(Number(e.target.value) || 0)}
          />

          <Input
            label="Reference ID (Optional)"
            placeholder="e.g. UPI / Transaction Reference"
            value={payRef}
            onChange={(e) => setPayRef(e.target.value)}
          />
        </div>
      </Modal>

      {/* Garment Tag Preview Modal */}
      <Modal
        isOpen={showTagsModal}
        onClose={() => setShowTagsModal(false)}
        title="Garment Tags & Barcode Print Preview"
        description={`Tags generated for ${order.orderNumber}`}
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowTagsModal(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={() => window.print()}
            >
              Print All Tags
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
          {order.items.flatMap((item, idx) =>
            Array.from({ length: item.quantity }).map((_, itemIndex) => {
              const tagCode = `WSH-${order.orderNumber.replace('#ORD-', '')}-${idx + 1}-${itemIndex + 1}`;
              return (
                <div
                  key={`${item.id}-${itemIndex}`}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 space-y-2 text-center"
                >
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                    <span>WASHORA</span>
                    <span>{order.orderNumber}</span>
                  </div>
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                    {item.productName}
                  </p>
                  <div className="py-2 px-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-xs font-bold tracking-widest text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
                    <QrCode className="w-4 h-4 text-primary-600" />
                    <span>{tagCode}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{(order.customer?.name || 'Customer').split(' ')[0]}</span>
                    <span className="font-semibold text-primary-600">{item.tier}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Modal>

      {/* Cancel Order Dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={() => {
          cancelOrder(order.id, cancelReason);
          setShowCancelDialog(false);
        }}
        title="Cancel Order?"
        description="Are you sure you want to cancel this order? This action will mark all active garment stages as cancelled."
        confirmLabel="Cancel Order"
        variant="danger"
      />
    </div>
  );
}
