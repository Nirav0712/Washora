'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { OrderStatus } from '@washora/shared';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Search,
  Plus,
  Clock,
  ChevronRight,
  ShoppingBag,
  Building2,
} from 'lucide-react';

export default function OrdersListPage() {
  const { orders, activeBranch } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customer?.name && order.customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.customer?.phone && order.customer.phone.includes(searchQuery));

    const matchesStatus =
      selectedStatus === 'ALL' || order.orderStatus === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Orders & Garment Batches
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track active intake, processing stages, delivery dispatches, and customer balances
          </p>
        </div>

        <Link href="/pos">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
          >
            + Create Order
          </Button>
        </Link>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Pills Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Orders' },
            { id: OrderStatus.RECEIVED, label: 'Received' },
            { id: OrderStatus.PROCESSING, label: 'In Processing' },
            { id: OrderStatus.QC, label: 'QC Passed' },
            { id: OrderStatus.READY, label: 'Ready' },
            { id: OrderStatus.DELIVERED, label: 'Delivered' },
            { id: OrderStatus.CANCELLED, label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStatus === tab.id
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search #ORD, customer, phone..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* Orders Table GlassCard */}
      <GlassCard className="p-6">
        <div className="overflow-x-auto">
          {filteredOrders.length === 0 ? (
            <EmptyState
              title="No Orders Found"
              description={searchQuery ? `No orders matched "${searchQuery}"` : "No orders found in this status."}
              actionLabel="+ Create Order"
              onAction={() => window.location.assign('/pos')}
            />
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3">Order Number</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Items & Services</th>
                  <th className="pb-3">Created / Due</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Payment</th>
                  <th className="pb-3 text-right">Total</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-4">
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-mono font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1.5"
                      >
                        {order.orderNumber}
                        {order.express && (
                          <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 px-1 py-0.5 rounded font-sans font-bold">
                            EXP
                          </span>
                        )}
                      </Link>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {order.branchName || activeBranch.name}
                      </span>
                    </td>

                    <td className="py-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {order.customer?.name || 'Walk-in Customer'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {order.customer?.phone || '-'}
                      </div>
                    </td>

                    <td className="py-4 max-w-[200px]">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {order.itemCount} Garments
                      </span>
                      <p className="text-[11px] text-slate-400 truncate">
                        {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                      </p>
                    </td>

                    <td className="py-4 text-slate-600 dark:text-slate-300">
                      <div className="font-medium">{formatDate(order.createdAt)}</div>
                      <div className="text-[10px] text-primary-600 dark:text-primary-400 flex items-center gap-1 mt-0.5 font-semibold">
                        <Clock className="w-3 h-3" /> Due {formatDate(order.expectedDeliveryDate)}
                      </div>
                    </td>

                    <td className="py-4">
                      <StatusPill status={order.orderStatus} size="sm" />
                    </td>

                    <td className="py-4">
                      <StatusPill status={order.paymentStatus} size="sm" showDot={false} />
                      {order.dueAmount > 0 && (
                        <span className="text-[10px] text-rose-600 font-bold block mt-0.5 font-mono">
                          Due: {formatCurrency(order.dueAmount)}
                        </span>
                      )}
                    </td>

                    <td className="py-4 text-right">
                      <span className="font-bold font-sans text-sm text-slate-900 dark:text-white">
                        {formatCurrency(order.total)}
                      </span>
                    </td>

                    <td className="py-4 text-right">
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-primary-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-primary-600 font-semibold text-xs transition-colors"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
