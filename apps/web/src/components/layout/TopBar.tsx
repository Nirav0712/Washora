'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Bell,
  HelpCircle,
  Building2,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { BrandLogo } from './BrandLogo';

export const TopBar: React.FC = () => {
  const { activeBranch, setActiveBranchId, branches } = useApp();
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-20 w-full h-16 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8">
      {/* Mobile Logo or Desktop Global Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="lg:hidden">
          <BrandLogo size="sm" />
        </div>

        <div className="hidden sm:flex items-center relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search orders, customers, phone, garments... (Ctrl + K)"
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-transparent focus:border-primary-400 dark:focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none transition-all"
          />
          <kbd className="hidden md:inline-flex absolute right-3 text-[10px] uppercase font-bold text-slate-400 bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 shadow-2xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Actions: Branch Switcher, Quick + New Order, Notifications, User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dynamic Branch Dropdown */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setShowBranchMenu(!showBranchMenu)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200/50 dark:border-slate-700/50"
          >
            <Building2 className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
            <span className="max-w-[140px] truncate">{activeBranch.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showBranchMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                Switch Operational Branch
              </div>
              {branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setActiveBranchId(b.id);
                    setShowBranchMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-primary-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between ${
                    activeBranch.id === b.id
                      ? 'text-primary-600 dark:text-primary-400 font-bold bg-primary-50/50 dark:bg-primary-950/30'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="truncate">
                    <p className="font-semibold">{b.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{b.code}</p>
                  </div>
                  {activeBranch.id === b.id && (
                    <span className="w-2 h-2 rounded-full bg-primary-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick New Order Button */}
        <Link
          href="/pos"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-700 hover:to-secondary-600 text-white text-xs font-semibold shadow-md shadow-primary-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Order</span>
        </Link>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-600 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Notifications
                </span>
                <span className="text-[10px] text-primary-600 font-semibold cursor-pointer">
                  Mark all read
                </span>
              </div>
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Order #ORD-10251 Ready
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Customer Rahul Patel pickup scheduled for 6:30 PM.
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Express Saree Batch Complete
                  </p>
                  <p className="text-[11px] text-slate-500">
                    2 Silk sarees roll-pressed and QC approved.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Support Help */}
        <button
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:block"
          title="Washora Help & Guide"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Shop Avatar */}
        <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center cursor-pointer shadow-sm">
          CW
        </div>
      </div>
    </header>
  );
};
