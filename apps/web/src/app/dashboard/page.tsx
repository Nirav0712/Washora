'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { StatCard } from '@/components/ui/StatCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  IndianRupee,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
  Zap,
  Truck,
  Shirt,
  Layers,
} from 'lucide-react';

export default function ShopDashboardPage() {
  const { tenant, activeBranch, metrics, orders } = useApp();

  const dueOrdersCount = orders.filter((o) => o.dueAmount > 0).length;
  const readyOrders = orders.filter((o) => o.orderStatus === 'READY');
  const todayDeliveries = orders.filter(
    (o) => o.orderStatus === 'READY' || o.orderStatus === 'OUT_FOR_DELIVERY'
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Good Morning, {tenant.name} 👋
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Operational Hub: <span className="font-semibold text-slate-700 dark:text-slate-300">{activeBranch.name}</span> · Here's what's happening today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/pos">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            >
              New Order
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Glass Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(metrics.revenueToday)}
          change={`+${metrics.revenueChangePercent}%`}
          isPositive={true}
          subtext="vs yesterday"
          icon={IndianRupee}
          iconBg="bg-blue-50 dark:bg-blue-950/50"
          iconColor="text-blue-600 dark:text-blue-400"
        />

        <StatCard
          title="Total Orders"
          value={orders.length}
          change={`+${metrics.ordersChangePercent}%`}
          isPositive={true}
          subtext="active this week"
          icon={ShoppingBag}
          iconBg="bg-indigo-50 dark:bg-indigo-950/50"
          iconColor="text-indigo-600 dark:text-indigo-400"
        />

        <StatCard
          title="Ready for Pickup"
          value={readyOrders.length}
          change=""
          isPositive={true}
          subtext={`${todayDeliveries.length} delivery queue`}
          icon={CheckCircle2}
          iconBg="bg-emerald-50 dark:bg-emerald-950/50"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />

        <StatCard
          title="Customer Dues"
          value={formatCurrency(metrics.dueAmountTotal)}
          change=""
          isPositive={false}
          subtext={`${dueOrdersCount} pending accounts`}
          icon={Clock}
          iconBg="bg-amber-50 dark:bg-amber-950/50"
          iconColor="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Sales Overview + Garment Processing Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Overview Visual Chart */}
        <GlassCard className="p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Sales & Revenue Overview
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Weekly billing throughput for {activeBranch.name}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/50 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                +18.4% this week
              </span>
            </div>

            {/* Custom Bar Visualization */}
            <div className="mt-6 grid grid-cols-7 gap-3 items-end h-48 pt-6">
              {metrics.weeklySales.map((item) => {
                const maxAmount = 35000;
                const heightPercent = Math.min(100, Math.round((item.amount / maxAmount) * 100));
                const isToday = item.day === 'Thu';

                return (
                  <div key={item.day} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-1.5 py-0.5 rounded shadow-sm text-center whitespace-nowrap">
                      {formatCurrency(item.amount)}
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-xl h-full flex items-end p-1 relative overflow-hidden">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-lg transition-all duration-500 ${
                          isToday
                            ? 'bg-gradient-to-t from-primary-600 to-secondary-400 shadow-md shadow-primary-500/30'
                            : 'bg-primary-200/70 dark:bg-primary-900/50 group-hover:bg-primary-300 dark:group-hover:bg-primary-700'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        isToday
                          ? 'text-primary-600 dark:text-primary-400 font-bold'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-600" /> Current Week
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary-400" /> Express Intake
              </span>
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Branch SLA: 24-48 hrs
            </span>
          </div>
        </GlassCard>

        {/* Live Status Distribution & Quick Actions */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Garment Flow Status
            </h2>
            <div className="space-y-3">
              {metrics.statusBreakdown.map((statusItem) => {
                return (
                  <div key={statusItem.status} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: statusItem.color }}
                      />
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {statusItem.label}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                      {statusItem.count} items
                    </span>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Rapid Shortcut Actions */}
          <GlassCard className="p-5 bg-gradient-to-br from-primary-600/90 to-secondary-600/90 text-white shadow-lg shadow-primary-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-amber-300" />
              <h3 className="font-bold text-sm">Quick Counter Actions</h3>
            </div>
            <p className="text-xs text-blue-50 mb-4 leading-relaxed">
              Fast-track intake, scan garment tags, or process instant express drop-offs.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <Link
                href="/pos"
                className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all text-center flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Express POS</span>
              </Link>
              <Link
                href="/products"
                className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all text-center flex items-center justify-center gap-1.5"
              >
                <Shirt className="w-3.5 h-3.5" />
                <span>Price List</span>
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Two Column Section: Recent Orders & Today's Delivery */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <GlassCard className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Orders
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Latest customer drops and processing state
              </p>
            </div>
            <Link
              href="/orders"
              className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 flex items-center gap-1"
            >
              View all orders <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            {orders.length === 0 ? (
              <EmptyState
                title="No Orders Yet"
                description="Your first laundry order will appear here once created at the POS counter."
                actionLabel="+ Create First Order"
                onAction={() => window.location.assign('/pos')}
              />
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Order ID</th>
                    <th className="pb-3 font-semibold">Customer</th>
                    <th className="pb-3 font-semibold">Items</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Amount</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {orders.slice(0, 5).map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 font-bold text-slate-900 dark:text-white">
                        <Link
                          href={`/orders/${order.id}`}
                          className="text-primary-600 hover:underline flex items-center gap-1 font-mono font-bold"
                        >
                          {order.orderNumber}
                          {order.express && (
                            <span className="w-2 h-2 rounded-full bg-amber-400" title="Express" />
                          )}
                        </Link>
                      </td>
                      <td className="py-3.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {order.customer?.name || 'Walk-in Customer'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {order.customer?.phone || '-'}
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-600 dark:text-slate-300">
                        <span className="font-semibold">{order.itemCount} items</span>
                        <p className="text-[11px] text-slate-400 truncate max-w-[140px]">
                          {order.items.map((i) => i.productName).join(', ')}
                        </p>
                      </td>
                      <td className="py-3.5">
                        <StatusPill status={order.orderStatus} size="sm" />
                      </td>
                      <td className="py-3.5 text-right font-bold text-slate-900 dark:text-white">
                        <div>{formatCurrency(order.total)}</div>
                        <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          {order.paymentStatus}
                        </div>
                      </td>
                      <td className="py-3.5 text-right">
                        <Link
                          href={`/orders/${order.id}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-primary-50 dark:bg-slate-800 dark:hover:bg-primary-950/60 text-slate-700 hover:text-primary-600 dark:text-slate-300 font-semibold text-[11px] transition-colors"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </GlassCard>

        {/* Today's Delivery Tracker */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Today's Delivery
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ready pickups and home routes
              </p>
            </div>
            <Truck className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>

          <div className="mt-4 space-y-3">
            {todayDeliveries.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No orders pending pickup or delivery today.
              </p>
            ) : (
              todayDeliveries.map((del) => (
                <Link
                  key={del.id}
                  href={`/orders/${del.id}`}
                  className="block p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/40 hover:border-primary-300 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
                      {del.orderNumber}
                    </span>
                    <StatusPill status={del.orderStatus} size="sm" />
                  </div>
                  <div className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {del.customer?.name || 'Walk-in Customer'}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between mt-1">
                    <span>{del.items.length} garments</span>
                    <span className="text-emerald-600 font-bold">
                      {formatCurrency(del.total)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
