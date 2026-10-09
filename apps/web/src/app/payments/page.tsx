'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Order, PaymentMethod, PaymentStatus } from '@washora/shared';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  CreditCard,
  IndianRupee,
  Clock,
  CheckCircle2,
  Receipt,
  RotateCcw,
} from 'lucide-react';

export default function PaymentsPage() {
  const { orders, recordPayment, issueRefund, activeBranch } = useApp();
  const [selectedOrderForPay, setSelectedOrderForPay] = useState<Order | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>(PaymentMethod.UPI);
  const [payRef, setPayRef] = useState<string>('');

  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState<Order | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState<string>('Fabric defect compensation');

  const dueOrders = orders.filter((o) => o.dueAmount > 0);
  const totalCollected = orders.reduce((sum, o) => sum + o.paidAmount, 0);
  const totalDue = orders.reduce((sum, o) => sum + o.dueAmount, 0);

  // Breakdown by method
  const upiCollected = orders.reduce((sum, o) => (o.paymentMethod === PaymentMethod.UPI ? sum + o.paidAmount : sum), 0);
  const cardCollected = orders.reduce((sum, o) => (o.paymentMethod === PaymentMethod.CARD ? sum + o.paidAmount : sum), 0);
  const cashCollected = orders.reduce((sum, o) => (o.paymentMethod === PaymentMethod.CASH ? sum + o.paidAmount : sum), 0);

  const handleRecordPayment = () => {
    if (!selectedOrderForPay || payAmount <= 0) return;
    recordPayment(selectedOrderForPay.id, payAmount, payMethod, payRef);
    setSelectedOrderForPay(null);
  };

  const handleProcessRefund = () => {
    if (!selectedOrderForRefund || refundAmount <= 0) return;
    issueRefund(selectedOrderForRefund.id, refundAmount, refundReason);
    setSelectedOrderForRefund(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Payments & Due Ledger
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Daily collection reconciliation and customer balance settlements for <span className="font-semibold text-slate-700 dark:text-slate-300">{activeBranch.name}</span>
        </p>
      </div>

      {/* Tally Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Total Collected</span>
            <div className="text-2xl font-extrabold text-emerald-600 font-sans mt-1">
              {formatCurrency(totalCollected)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">All payment channels</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Outstanding Due</span>
            <div className="text-2xl font-extrabold text-rose-600 font-sans mt-1">
              {formatCurrency(totalDue)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{dueOrders.length} pending accounts</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">UPI / QR Collections</span>
            <div className="text-2xl font-extrabold text-primary-600 font-sans mt-1">
              {formatCurrency(upiCollected)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Digital scan & pay</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-xs">
            UPI
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Cash Register</span>
            <div className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-sans mt-1">
              {formatCurrency(cashCollected)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Drawer balance</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <IndianRupee className="w-6 h-6" />
          </div>
        </GlassCard>
      </div>

      {/* Outstanding Due Orders Table */}
      <GlassCard className="p-6">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
          Unpaid & Partial Balance Orders ({dueOrders.length})
        </h2>

        <div className="overflow-x-auto">
          {dueOrders.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              All active orders have settled payment in full!
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3">Order Number</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Order Total</th>
                  <th className="pb-3">Amount Paid</th>
                  <th className="pb-3">Balance Due</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {dueOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                    <td className="py-3.5 font-mono font-bold text-primary-600">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5 font-bold text-slate-900 dark:text-white">
                      {order.customer?.name || 'Walk-in Customer'}
                      <span className="text-[11px] text-slate-400 font-mono block font-normal">
                        {order.customer?.phone || '-'}
                      </span>
                    </td>
                    <td className="py-3.5 font-semibold font-sans">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="py-3.5 text-emerald-600 font-bold font-sans">
                      {formatCurrency(order.paidAmount)}
                    </td>
                    <td className="py-3.5 text-rose-600 font-bold font-sans">
                      {formatCurrency(order.dueAmount)}
                    </td>
                    <td className="py-3.5">
                      <StatusPill status={order.paymentStatus} size="sm" />
                    </td>
                    <td className="py-3.5 text-right">
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => {
                          setSelectedOrderForPay(order);
                          setPayAmount(order.dueAmount);
                        }}
                      >
                        Collect Due
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>

      {/* Collect Balance Modal */}
      <Modal
        isOpen={!!selectedOrderForPay}
        onClose={() => setSelectedOrderForPay(null)}
        title="Collect Due Payment"
        description={`Order: ${selectedOrderForPay?.orderNumber} (${selectedOrderForPay?.customer?.name || 'Customer'})`}
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setSelectedOrderForPay(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleRecordPayment}>
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
            value={payAmount}
            onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
          />

          <Input
            label="Transaction Reference (Optional)"
            placeholder="e.g. UPI Ref / Card Last 4"
            value={payRef}
            onChange={(e) => setPayRef(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
