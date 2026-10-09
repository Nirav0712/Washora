'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  Truck,
  MapPin,
  CreditCard,
  Phone,
  AlertCircle,
  Package,
} from 'lucide-react';
import { customerPortalApi } from '@/lib/api/customer-portal';
import { useCustomerAuth } from '@/context/CustomerAuthContext';

export default function CustomerDashboardPage() {
  const { customer, tenant } = useCustomerAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await customerPortalApi.getDashboard();
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard.');
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-28 bg-white/60 animate-pulse rounded-2xl border border-slate-200" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white animate-pulse rounded-2xl border border-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const activeOrders = data?.activeOrders || [];
  const upcomingDelivery = data?.upcomingDelivery;
  const upcomingPickup = data?.upcomingPickup;
  const recentOrders = data?.recentOrders || [];

  return (
    <div className="space-y-6">
      {/* Welcome Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-blue-500/15">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Welcome to your customer portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hello, {customer?.name || 'Valued Customer'} 👋
          </h1>
          <p className="mt-1 text-sm text-blue-100 font-medium">
            Track real-time garment status, manage deliveries, and view invoices with ease.
          </p>
        </div>

        {/* Decorative circle background */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Orders</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{kpis.activeOrdersCount ?? 0}</p>
          <span className="text-[11px] text-slate-400 font-medium">In processing & delivery</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ready for Pickup</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600">{kpis.readyOrdersCount ?? 0}</p>
          <span className="text-[11px] text-slate-400 font-medium">Cleaned & packed</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount Due</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600">₹{kpis.amountDue ?? 0}</p>
          <span className="text-[11px] text-slate-400 font-medium">Outstanding balance</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{kpis.totalOrdersCount ?? 0}</p>
          <span className="text-[11px] text-slate-400 font-medium">Lifetime orders</span>
        </div>
      </div>

      {/* Upcoming Logistics Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {upcomingDelivery ? (
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-blue-200/80 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                <Truck className="w-4 h-4" />
                <span>Upcoming Delivery</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-200/60 text-blue-800 uppercase">
                {upcomingDelivery.status}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Scheduled Date: <strong className="text-slate-900">{upcomingDelivery.scheduledDate}</strong>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Address: {upcomingDelivery.deliveryAddress?.addressLine1 || 'Default Address'}
            </p>
          </div>
        ) : null}

        {upcomingPickup ? (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <MapPin className="w-4 h-4" />
                <span>Upcoming Pickup</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200/60 text-emerald-800 uppercase">
                {upcomingPickup.status}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Scheduled Date: <strong className="text-slate-900">{upcomingPickup.scheduledDate}</strong>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Address: {upcomingPickup.pickupAddress?.addressLine1 || 'Default Address'}
            </p>
          </div>
        ) : null}
      </div>

      {/* Active Orders Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Active Laundry Orders</h2>
            <p className="text-xs text-slate-500">Live garment status and tracking</p>
          </div>
          <Link
            href="/portal/orders"
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeOrders.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
            <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">No active orders right now.</p>
            <p className="text-xs text-slate-400 mt-0.5">All your laundry items have been delivered!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOrders.map((order: any) => (
              <div
                key={order.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-400/80 bg-slate-50/50 hover:bg-white transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      #{order.orderNumber}
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {order.itemCount} items • ₹{order.grandTotal}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                    {order.customerFacingStatus || order.status}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    Due: <strong className="text-slate-900">₹{order.dueAmount}</strong>
                  </span>
                  <Link
                    href={`/portal/orders/${order.id}`}
                    className="flex items-center gap-1.5 text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Track Order</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Completed Orders Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Recent Order History</h2>
          <Link
            href="/portal/orders"
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <span>See Full History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No order history found.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentOrders.map((order: any) => (
              <div key={order.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">#{order.orderNumber}</span>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-700">
                      {order.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString()} • {order.itemCount} items
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">₹{order.grandTotal}</p>
                  <Link
                    href={`/portal/orders/${order.id}`}
                    className="text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    Details & Invoice
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
