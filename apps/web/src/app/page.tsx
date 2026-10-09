'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PublicNavbar } from '@/components/marketing/PublicNavbar';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { InteractivePosDemo } from '@/components/marketing/InteractivePosDemo';
import { RoiCalculator } from '@/components/marketing/RoiCalculator';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Printer,
  Smartphone,
  Truck,
  Shirt,
  Users,
  CreditCard,
  BarChart3,
  Building2,
  Layers,
  Clock,
  ChevronDown,
  Star,
  MapPin,
  Lock,
  Headphones,
  Check,
} from 'lucide-react';

export default function HomePage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      q: 'How does Washora prevent lost or misplaced laundry garments?',
      a: 'Washora generates individual thermal heat-resistant QR barcode tags for every garment during counter intake. Staff scan garments at every processing stage (sorting, washing, inspection, and dispatch). Any mismatched item alerts the operator immediately.',
    },
    {
      q: 'Can I manage multiple laundry branches or a central wash factory?',
      a: 'Yes! Washora supports multi-branch operations and centralized processing factories with strict branch-level scoping, driver inter-branch transfers, and aggregated multi-location P&L reporting.',
    },
    {
      q: 'Do customers need to download a mobile app to track their clothes?',
      a: 'No app download is required! Customers receive an instant WhatsApp or SMS notification containing a direct link to their live online tracking portal, complete with invoice breakdown and status progress.',
    },
    {
      q: 'Can I set different permissions for cashiers, delivery drivers, and managers?',
      a: 'Yes. Washora provides granular Level 4 RBAC role management. You can use ready-made templates (Cashier, Branch Manager, Delivery Agent, QC Inspector) or create custom roles with tailored module permissions.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F6F8FB] dark:bg-[#0B0F19] text-[#172033] dark:text-[#F1F5F9] transition-colors">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
        {/* Decorative Background Blur */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold tracking-wide shadow-sm animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>The Next-Gen SaaS for Dry Cleaners & Laundromats</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Manage Your Laundry Business{' '}
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Without the Chaos
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Fast 10-second counter POS, heat-resistant QR garment tags, automated WhatsApp billing, and intelligent driver dispatch. Built for independent shops and multi-branch franchises.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-extrabold text-sm shadow-xl shadow-blue-600/25 hover:shadow-2xl hover:shadow-blue-600/35 transition-all hover:scale-[1.02]"
              >
                Start 14-Day Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm transition"
              >
                View Pricing Plans
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Instant 2-minute setup
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Thermal printer compatible
              </span>
            </div>
          </div>

          {/* Interactive POS Counter Preview Widget */}
          <div className="mt-14 lg:mt-18">
            <InteractivePosDemo />
          </div>
        </div>
      </section>

      {/* Laundry Operations Workflow Section */}
      <section className="py-20 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              End-to-End Laundry Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Designed for the Fast Reality of Real Laundry Shops
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              From the moment a customer drops a bag of dirty garments to doorstep delivery, every step is automated and accounted for.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 relative group hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center font-black text-lg mb-4">
                01
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Rapid Counter Intake
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Add 15+ garments in seconds. Set starch preferences, stain markers, and print thermal heat-proof QR tags instantly.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 relative group hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-900/60 text-cyan-600 dark:text-cyan-300 flex items-center justify-center font-black text-lg mb-4">
                02
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Factory & QC Tracking
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Track sorting, washing, dry-cleaning, ironing, and quality inspection. Zero misplaced clothes with item-by-item barcodes.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 relative group hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-black text-lg mb-4">
                03
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Automated WhatsApp Invoices
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Customers receive instant digital invoices and live order tracking links via WhatsApp without manual typing.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 relative group hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-black text-lg mb-4">
                04
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Smart Driver Dispatch
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Assign pickups and deliveries to delivery agents with optimized route mapping, OTP confirmations, and cash collection logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Everything You Need to Scale from 1 to 50 Branches
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            A comprehensive, battle-tested platform engineered specifically for garment care businesses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">High-Speed POS Counter</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Keyboard shortcuts, item modifiers, express turnaround charges, discounts, and instant thermal receipt printing.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-900/40 text-cyan-600 flex items-center justify-center font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">QR Barcode Tag Workflows</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Individual garment piece identification tags with customer phone, rack location, and service specifications.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Pickup & Delivery Logistics</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Dispatch mobile drivers, track live order stops, and capture proof of delivery with customer signatures or OTP.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Staff Attendance & Payroll</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Track daily employee check-ins, overtime hours, monthly payroll calculations, and commission incentives.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">UPI & Ledger Dues Tracking</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Record advance payments, partial dues, dynamic QR code settlements, and send automated payment reminder links.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Granular Custom RBAC Roles</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Create tailor-made permissions for every staff tier. Prevent unauthorized refunds or confidential revenue leaks.
            </p>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section className="py-16">
        <RoiCalculator />
      </section>

      {/* Pricing Comparison Preview */}
      <section className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Simple, Predictable Plans for Growing Shops
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              All plans include full POS, garment tagging, customer CRM, and automated notifications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Starter</h3>
                <p className="text-xs text-slate-500 mt-1">Single counter or small laundry shop</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">₹999</span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> 1 Branch Location</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> Up to 3 Staff Members</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> Full POS & Garment Tagging</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> WhatsApp Instant Invoices</li>
                </ul>
              </div>
              <Link
                href="/register"
                className="w-full py-3 rounded-xl text-center text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 transition"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Professional Plan (Featured) */}
            <div className="bg-gradient-to-b from-blue-900 via-slate-900 to-slate-950 text-white rounded-3xl p-8 border-2 border-blue-500 shadow-2xl relative flex flex-col justify-between space-y-6 scale-105">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 font-black text-[11px] uppercase tracking-wider">
                Most Popular
              </span>
              <div>
                <h3 className="text-lg font-bold text-white">Professional</h3>
                <p className="text-xs text-blue-200 mt-1">High-volume stores with home pickup</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">₹2,499</span>
                  <span className="text-xs text-blue-200">/ month</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-slate-200">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400 shrink-0" /> Up to 3 Branch Locations</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400 shrink-0" /> Up to 10 Staff Members</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400 shrink-0" /> Automated Driver Dispatch</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400 shrink-0" /> Custom RBAC Permissions</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400 shrink-0" /> Inventory & Chemical Stock</li>
                </ul>
              </div>
              <Link
                href="/register"
                className="w-full py-3.5 rounded-xl text-center text-xs font-black text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-600/30 transition"
              >
                Start 14-Day Free Trial
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Franchise & Enterprise</h3>
                <p className="text-xs text-slate-500 mt-1">Multi-city chains & industrial factories</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">₹5,999</span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> Unlimited Hubs & Factories</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> Unlimited Staff Accounts</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> Dedicated Account Manager</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> Custom WhatsApp API Number</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> Custom Domain & Branding</li>
                </ul>
              </div>
              <Link
                href="/contact"
                className="w-full py-3 rounded-xl text-center text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-100 transition border border-slate-200 dark:border-slate-600"
              >
                Contact Enterprise Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Got Questions?
          </span>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isOpen ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final Call to Action Banner */}
      <section className="pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 rounded-3xl p-10 sm:p-14 text-white text-center shadow-2xl shadow-blue-600/20 relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-6 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Ready to Modernize Your Laundry Business?
            </h2>
            <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
              Join hundreds of forward-thinking laundry shop owners who run faster counters, happier customers, and zero lost garments.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-blue-700 font-black text-sm shadow-xl hover:bg-blue-50 transition hover:scale-105"
              >
                Start 14-Day Free Trial
              </Link>
              <Link
                href="/contact"
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-blue-800/60 hover:bg-blue-800 text-white font-bold text-sm border border-white/20 transition"
              >
                Schedule 1-on-1 Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
