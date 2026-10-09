'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Zap,
  Globe,
  Lock,
  Heart,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Sparkles,
} from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
                W
              </div>
              <span className="font-black text-2xl tracking-tight text-white">Washora</span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              The high-velocity, all-in-one SaaS operating system for modern dry cleaners, laundromats, garment spas, and multi-branch laundry franchises.
            </p>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Multi-Tenant ISO-Ready
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> 256-Bit Encrypted
              </span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Product & Workflows</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/features" className="hover:text-cyan-400 transition">Express POS Counter</Link></li>
              <li><Link href="/features" className="hover:text-cyan-400 transition">QR & Tag Garment Tracking</Link></li>
              <li><Link href="/features" className="hover:text-cyan-400 transition">Automated Driver Dispatch</Link></li>
              <li><Link href="/features" className="hover:text-cyan-400 transition">Customer Tracking Portal</Link></li>
              <li><Link href="/features" className="hover:text-cyan-400 transition">WhatsApp Instant Invoices</Link></li>
              <li><Link href="/pricing" className="hover:text-cyan-400 transition">Subscription Pricing</Link></li>
            </ul>
          </div>

          {/* Platform & Roles */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Platform Portals</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/login" className="hover:text-cyan-400 transition">Shop Admin Login</Link></li>
              <li><Link href="/portal/login" className="hover:text-cyan-400 transition">Customer Online Portal</Link></li>
              <li><Link href="/track" className="hover:text-cyan-400 transition">Live Garment Tracker</Link></li>
              <li><Link href="http://localhost:3002/partner-dashboard" target="_blank" className="hover:text-cyan-400 transition">Sales Partner Portal</Link></li>
              <li><Link href="http://localhost:3002/login" target="_blank" className="hover:text-cyan-400 transition">Super Admin Center</Link></li>
              <li><Link href="/register" className="hover:text-cyan-400 transition">14-Day Free Trial</Link></li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Support & Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/faq" className="hover:text-cyan-400 transition">Help & FAQs</Link></li>
              <li><Link href="/contact" className="hover:text-cyan-400 transition">Schedule Live Demo</Link></li>
              <li><Link href="/contact" className="hover:text-cyan-400 transition">Enterprise Contact</Link></li>
              <li><span className="text-slate-500">Privacy Policy</span></li>
              <li><span className="text-slate-500">Terms of Service</span></li>
              <li><span className="text-slate-500">Security & Isolation</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Washora Technologies Inc. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered for high-throughput laundry operations across India & global markets.
          </p>
        </div>
      </div>
    </footer>
  );
};
