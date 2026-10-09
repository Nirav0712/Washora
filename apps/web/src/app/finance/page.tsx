'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  CreditCard,
  Building2,
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Calendar,
  Layers,
} from 'lucide-react';
import { financeApi, FinanceDashboardSummary } from '@/lib/api/finance';
import { useApp } from '@/context/AppContext';

export default function FinancePage() {
  const { activeBranch } = useApp();
  const [data, setData] = useState<FinanceDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinanceDashboard();
  }, [activeBranch]);

  const loadFinanceDashboard = async () => {
    try {
      setLoading(true);
      const res = await financeApi.getDashboard(activeBranch?.id);
      setData(res);
    } catch (err) {
      console.error('Failed to load finance dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  const summary = data?.summary || {
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    totalReceivables: 0,
    totalPayables: 0,
    inventoryValuation: 0,
  };

  const isProfitable = summary.netProfit >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-primary-600 dark:text-primary-400" />
              Financial & P&L Overview
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Real-time operational revenue, expenses, net margins, receivables & inventory assets.
            </p>
          </div>
        </div>

        {/* Primary KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              ₹{(summary.totalRevenue / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Customer payments collected</p>
          </div>

          {/* Expenses */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Operational Expenses</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              ₹{(summary.totalExpenses / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">Approved & paid store costs</p>
          </div>

          {/* Net Profit */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Net Operating Profit</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <h2 className={`text-2xl font-bold ${isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              ₹{(summary.netProfit / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Margin: <span className="font-bold text-slate-900 dark:text-white">{summary.profitMargin}%</span>
            </p>
          </div>

          {/* Inventory Valuation */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Stock Assets Value</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              ₹{(summary.inventoryValuation / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Weighted avg stock cost</p>
          </div>
        </div>

        {/* Receivables & Payables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer Receivables</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                ₹{(summary.totalReceivables / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Unpaid customer order balances</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier Payables</p>
              <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                ₹{(summary.totalPayables / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Outstanding vendor balances</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Recent Financial Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Revenue */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              Recent Revenue Transactions
            </h3>
            {loading ? (
              <p className="text-xs text-slate-400 py-4">Loading payments...</p>
            ) : !data?.recentPayments || data.recentPayments.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No recent payments recorded</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {data.recentPayments.map((p, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {p.customerId?.fullName || 'Customer'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {p.method} · {p.paymentNumber}
                      </p>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      +₹{((p.amount || 0) / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Expenses */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-rose-500" />
              Recent Expense Disbursements
            </h3>
            {loading ? (
              <p className="text-xs text-slate-400 py-4">Loading expenses...</p>
            ) : !data?.recentExpenses || data.recentExpenses.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No recent expenses recorded</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {data.recentExpenses.map((exp, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{exp.title}</p>
                      <p className="text-xs text-slate-400">
                        {exp.categoryId?.name || 'General'} · {exp.expenseNumber}
                      </p>
                    </div>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      -₹{((exp.amount || 0) / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
