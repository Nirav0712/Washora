'use client';

import React from 'react';
import Link from 'next/link';
import { PublicNavbar } from '@/components/marketing/PublicNavbar';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import {
  Zap,
  Printer,
  Truck,
  Users,
  CreditCard,
  ShieldCheck,
  Smartphone,
  BarChart3,
  Boxes,
  MessageSquare,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export default function FeaturesPage() {
  const featureList = [
    {
      title: 'Ultra-Fast POS Counter Intake',
      icon: Zap,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/40',
      description:
        'Designed for busy morning rush hours. Complete customer intake with customizable garment categories, starch levels, hanger vs fold preferences, and express 24-hour turnaround fees in under 10 seconds.',
    },
    {
      title: 'Thermal QR & Barcode Garment Tagging',
      icon: Printer,
      color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/40',
      description:
        'Generate heat-resistant, dry-clean-safe thermal garment tags for every piece. Includes customer phone, rack slot number, and service codes to guarantee zero misplaced or lost garments.',
    },
    {
      title: 'Automated WhatsApp Customer Notifications',
      icon: MessageSquare,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40',
      description:
        'Send instant order confirmation receipts, payment links, and "Ready for Pickup" WhatsApp alerts directly to customers without manual copy-pasting.',
    },
    {
      title: 'Smart Driver Dispatch & Doorstep Logistics',
      icon: Truck,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40',
      description:
        'Organize home pickups and deliveries into optimized routes. Delivery drivers can log cash collections, capture digital signatures, and verify orders via customer OTP.',
    },
    {
      title: 'Granular Custom Role & Permission Builder',
      icon: ShieldCheck,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/40',
      description:
        'Create tailor-made user roles for cashiers, pressers, QC inspectors, and branch managers. Prevent unauthorized refund creation, discounts, or sensitive ledger access.',
    },
    {
      title: 'Staff Shifts, Attendance & Payroll',
      icon: Users,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/40',
      description:
        'Log employee daily attendance, shift timing, leave requests, overtime hours, piece-rate ironing incentives, and monthly automated payroll generation.',
    },
    {
      title: 'Inventory & Chemical Stock Tracking',
      icon: Boxes,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/40',
      description:
        'Keep track of detergents, fabric softeners, collar stiffeners, poly-rolls, and hangers. Automatic re-order thresholds alert you before you run out of essential supplies.',
    },
    {
      title: 'Multi-Branch Analytics & P&L Reporting',
      icon: BarChart3,
      color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/40',
      description:
        'Compare sales throughput, customer retention, average order values, and labor costs across all your shop branches in one consolidated executive dashboard.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F6F8FB] dark:bg-[#0B0F19] text-[#172033] dark:text-[#F1F5F9]">
      <PublicNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Engineered for Modern Garment Care
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Every Feature Built to Solve Real Laundry Bottlenecks
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Discover why leading dry cleaners and multi-location franchises trust Washora to power their daily shop operations.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {featureList.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${feat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{feat.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl p-10 text-white text-center space-y-6 max-w-5xl mx-auto shadow-xl">
          <h2 className="text-3xl font-black">Experience Washora in Your Shop Today</h2>
          <p className="text-sm text-blue-100 max-w-xl mx-auto">
            Test our express POS counter, print sample thermal tags, and try WhatsApp billing risk-free for 14 days.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-blue-700 font-extrabold text-sm shadow-lg hover:bg-blue-50 transition"
          >
            Start 14-Day Free Trial
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
