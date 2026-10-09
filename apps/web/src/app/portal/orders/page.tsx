'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  ExternalLink,
} from 'lucide-react';
import { customerPortalApi } from '@/lib/api/customer-portal';

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterTabs = [
    { label: 'All Orders', value: 'ALL' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Ready', value: 'READY' },
    { label: 'Completed', value: 'COMPLETED' },
  ];

  const fetchOrders = async (status: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await customerPortalApi.getOrders({ status });
      setOrders(res.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(statusFilter);
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            My Laundry Orders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            View order status, garment details, invoices, and delivery estimates
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === tab.value
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white animate-pulse rounded-2xl border border-slate-200" />
          ))}
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
          <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No orders found</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {statusFilter !== 'ALL'
              ? `No ${statusFilter.toLowerCase()} orders found.`
              : 'You have not placed any laundry orders yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isCompleted = order.status === 'COMPLETED';
            const isReady = order.status === 'READY';
            return (
              <div
                key={order.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-sm transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-slate-900 text-base">
                        #{order.orderNumber}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : isReady
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {order.customerFacingStatus || order.status}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>
                        Items: <strong className="text-slate-800">{order.itemCount} garments</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Branch: <strong className="text-slate-800">{order.branchName || 'Main'}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Payment: <strong className={order.dueAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                          {order.paymentStatus}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-slate-400 font-medium">Order Total</p>
                      <p className="text-lg font-black text-slate-900">₹{order.grandTotal}</p>
                    </div>

                    <Link
                      href={`/portal/orders/${order.id}`}
                      className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold transition-colors"
                    >
                      <span>Track & Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
