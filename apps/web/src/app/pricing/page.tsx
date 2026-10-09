'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PublicNavbar } from '@/components/marketing/PublicNavbar';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import {
  Check,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  Building,
  Users,
  CreditCard,
} from 'lucide-react';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');

  const discountMultiplier = billingCycle === 'ANNUAL' ? 0.8 : 1;

  const plans = [
    {
      name: 'Starter Hub',
      badge: 'Single Counter',
      monthlyPrice: 999,
      description: 'Ideal for independent dry cleaners and single laundromat counter setups.',
      features: [
        { name: '1 Branch Location', included: true },
        { name: 'Up to 3 Staff User Accounts', included: true },
        { name: 'POS & Thermal Garment Tagging', included: true },
        { name: 'WhatsApp & SMS Invoices', included: true },
        { name: 'Customer History & CRM', included: true },
        { name: 'Driver & Delivery Dispatch', included: false },
        { name: 'Custom RBAC Role Builder', included: false },
        { name: 'Inventory & Chemical Stock', included: false },
        { name: 'Multi-Branch Aggregated P&L', included: false },
      ],
      cta: 'Start 14-Day Free Trial',
      popular: false,
    },
    {
      name: 'Professional Pro',
      badge: 'Most Popular',
      monthlyPrice: 2499,
      description: 'For busy laundry businesses with home pickup routes and staff shifts.',
      features: [
        { name: 'Up to 3 Branch Hubs', included: true },
        { name: 'Up to 10 Staff User Accounts', included: true },
        { name: 'POS & Thermal Garment Tagging', included: true },
        { name: 'WhatsApp & SMS Invoices', included: true },
        { name: 'Customer History & CRM', included: true },
        { name: 'Driver & Delivery Dispatch', included: true },
        { name: 'Custom RBAC Role Builder', included: true },
        { name: 'Inventory & Chemical Stock', included: true },
        { name: 'Multi-Branch Aggregated P&L', included: false },
      ],
      cta: 'Start 14-Day Free Trial',
      popular: true,
    },
    {
      name: 'Franchise Enterprise',
      badge: 'Multi-Location',
      monthlyPrice: 5999,
      description: 'Central wash factories, multi-city franchise networks, and high-throughput chains.',
      features: [
        { name: 'Unlimited Branch Locations', included: true },
        { name: 'Unlimited Staff User Accounts', included: true },
        { name: 'POS & Thermal Garment Tagging', included: true },
        { name: 'WhatsApp & SMS Invoices', included: true },
        { name: 'Customer History & CRM', included: true },
        { name: 'Driver & Delivery Dispatch', included: true },
        { name: 'Custom RBAC Role Builder', included: true },
        { name: 'Inventory & Chemical Stock', included: true },
        { name: 'Multi-Branch Aggregated P&L', included: true },
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F6F8FB] dark:bg-[#0B0F19] text-[#172033] dark:text-[#F1F5F9]">
      <PublicNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Subscription Pricing & Entitlements
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Fair, Transparent Plans for Every Laundry Business
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            All plans come with a 14-day full feature trial. No credit card required. Cancel anytime.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="pt-4 flex items-center justify-center">
            <div className="bg-slate-200/80 dark:bg-slate-800 p-1.5 rounded-2xl flex items-center gap-1 border border-slate-300 dark:border-slate-700">
              <button
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
                  billingCycle === 'MONTHLY'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('ANNUAL')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  billingCycle === 'ANNUAL'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <span>Annual Billing</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const price = Math.round(plan.monthlyPrice * discountMultiplier);
            return (
              <div
                key={plan.name}
                className={`rounded-3xl p-8 flex flex-col justify-between space-y-8 transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-b from-blue-900 via-slate-900 to-slate-950 text-white border-2 border-blue-500 shadow-2xl scale-105 relative'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 font-black text-[11px] uppercase tracking-wider">
                    {plan.badge}
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    {!plan.popular && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 min-h-[32px]">
                    {plan.description}
                  </p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-black font-mono">₹{price}</span>
                    <span className="text-xs text-slate-400">/ month</span>
                  </div>
                  {billingCycle === 'ANNUAL' && (
                    <p className="text-[11px] text-emerald-500 font-semibold mt-1">
                      Billed ₹{price * 12} annually
                    </p>
                  )}

                  {/* Feature List */}
                  <div className="mt-8 space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Included Features</p>
                    <ul className="space-y-2.5 text-xs">
                      {plan.features.map((feat) => (
                        <li key={feat.name} className="flex items-center gap-2.5">
                          {feat.included ? (
                            <Check className={`w-4 h-4 shrink-0 ${plan.popular ? 'text-cyan-400' : 'text-blue-600'}`} />
                          ) : (
                            <X className="w-4 h-4 text-slate-400 shrink-0 opacity-40" />
                          )}
                          <span className={feat.included ? '' : 'text-slate-400 line-through opacity-60'}>
                            {feat.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Link
                  href={plan.name.includes('Enterprise') ? '/contact' : '/register'}
                  className={`w-full py-3.5 rounded-xl text-center text-xs font-bold transition-all shadow-md ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-blue-600/30'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
