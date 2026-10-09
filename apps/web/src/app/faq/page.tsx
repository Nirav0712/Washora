'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PublicNavbar } from '@/components/marketing/PublicNavbar';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { ChevronDown, HelpCircle, ArrowRight } from 'lucide-react';

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const categories = [
    {
      name: 'Getting Started & Hardware',
      items: [
        {
          q: 'What hardware or printers do I need to run Washora?',
          a: 'Washora runs smoothly on any modern desktop, laptop, iPad, Android tablet, or POS touchscreen terminal with a standard web browser. For printing garment tags and receipts, we support all standard 2-inch and 3-inch ESC/POS thermal printers (Epson, TVS, Citizen, Rugtek) and thermal tag roll printers.',
        },
        {
          q: 'Do I need a separate server, VPS, or Kubernetes setup in my store?',
          a: 'No local servers or complicated IT hardware required! Washora is a 100% managed cloud SaaS platform. You only need an internet connection and your counter device.',
        },
      ],
    },
    {
      name: 'Garment Tracking & Quality Control',
      items: [
        {
          q: 'How does heat-resistant thermal tagging work during hot water washing?',
          a: 'Washora formats tag identifiers for standard water-resistant and chemical-proof hydrofix/polyester tag rolls. These tags withstand boiling water, high-temp drying, and chemical dry-cleaning without smudging or falling off.',
        },
        {
          q: 'Can we track garments between a retail pickup counter and a central wash plant?',
          a: 'Yes. Our multi-branch logistics workflow allows you to scan bags into a transit manifest, assign them to a transport driver, and scan them in upon arrival at the central factory hub.',
        },
      ],
    },
    {
      name: 'Customer Notifications & Billing',
      items: [
        {
          q: 'How do customers receive digital bills on WhatsApp?',
          a: 'When an order is created or status is updated to Ready, Washora generates a digital receipt link and sends it automatically to the customer’s WhatsApp number.',
        },
        {
          q: 'Can customers check their order status without calling the store?',
          a: 'Yes! Every invoice includes a live customer tracking link. Customers can view the real-time stage of their garments (Sorting, Washing, QC, Ready for Pickup, Out for Delivery) with live delivery ETA.',
        },
      ],
    },
    {
      name: 'Plans, Multi-Branch & Security',
      items: [
        {
          q: 'Can I add more branches or staff as my laundry chain grows?',
          a: 'Yes, you can upgrade your plan or add additional branch locations anytime directly from your Shop Settings.',
        },
        {
          q: 'Is my customer phone database and revenue ledger kept private?',
          a: 'Yes. Every laundry business operates within a strictly isolated, encrypted tenant boundary. No other shop, partner, or unauthorized user can access your customer list or financials.',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F6F8FB] dark:bg-[#0B0F19] text-[#172033] dark:text-[#F1F5F9]">
      <PublicNavbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Frequently Asked Questions
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Everything You Need to Know
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Find quick answers to common questions regarding POS hardware, garment tags, customer tracking, and pricing.
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-8">
          {categories.map((cat, catIdx) => (
            <div key={cat.name} className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">
                {cat.name}
              </h3>
              <div className="space-y-3">
                {cat.items.map((item, itemIdx) => {
                  const uniqueIdx = catIdx * 10 + itemIdx;
                  const isOpen = openIndex === uniqueIdx;
                  return (
                    <div
                      key={item.q}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
                    >
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : uniqueIdx)}
                        className="w-full p-5 text-left font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between gap-4"
                      >
                        <span>{item.q}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform ${
                            isOpen ? 'rotate-180 text-blue-600' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Help Banner */}
        <div className="p-8 rounded-3xl bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-slate-800 text-center space-y-4">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Have a question not listed here?</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Our laundry systems support team is available 7 days a week to guide you through setup and printer testing.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition"
          >
            Contact Customer Support
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
