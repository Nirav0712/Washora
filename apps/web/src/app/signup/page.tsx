'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PublicNavbar } from '@/components/marketing/PublicNavbar';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import {
  Store,
  User,
  Mail,
  Lock,
  Phone,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building2,
  ShieldCheck,
  Zap,
  Printer,
  ArrowRight,
  Clock,
} from 'lucide-react';

export default function ShopOwnerSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    tenantName: '',
    businessType: 'LAUNDRY',
    branchName: 'Main Hub Flagship',
    partnerCode: '',
    acceptTerms: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tenantName || !formData.name || !formData.phone) {
      setError('Please fill in your shop name, owner name, and phone number.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please verify your confirm password.');
      setIsLoading(false);
      return;
    }

    if (!formData.acceptTerms) {
      setError('You must accept the Terms of Service and Privacy Policy.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          phone: formData.phone.trim(),
          tenantName: formData.tenantName.trim(),
          businessType: formData.businessType,
          branchName: formData.branchName.trim() || 'Main Hub',
          partnerCode: formData.partnerCode.trim() ? formData.partnerCode.trim().toUpperCase() : undefined,
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (res.ok && data?.success && data.data?.accessToken) {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('token', data.data.accessToken);
        localStorage.setItem('washora_access_token', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken || '');
        localStorage.setItem('user', JSON.stringify(data.data.user));
        localStorage.setItem('tenant', JSON.stringify(data.data.tenant));

        router.push('/dashboard');
      } else {
        const message =
          data?.message ||
          data?.error?.message ||
          (res.status >= 500
            ? 'Backend service is starting or temporarily unavailable. Please retry in a moment.'
            : 'Registration failed. Please check the details provided.');
        setError(message);
      }
    } catch (err: any) {
      setError(err?.message || 'Network error during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] dark:bg-[#0B0F19] text-[#172033] dark:text-[#F1F5F9] flex flex-col justify-between">
      <PublicNavbar />

      <div className="max-w-4xl w-full mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Value Prop Highlights */}
          <div className="lg:col-span-5 space-y-6 hidden lg:block">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                14-Day Free Trial
              </span>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Launch Your Laundry Shop in Minutes
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Join high-velocity laundry and dry cleaning operators who run faster counter intake and zero lost clothes.
              </p>
            </div>

            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">30-Second POS Drop-off</h4>
                  <p className="text-[11px] text-slate-500">Fast garment tagging, automatic weight & per-piece calculation.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 shrink-0">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Thermal Receipt & QR Stickers</h4>
                  <p className="text-[11px] text-slate-500">Print waterproof barcode garment labels and customer invoices.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Full Multi-Branch Isolation</h4>
                  <p className="text-[11px] text-slate-500">Dedicated store database, custom WhatsApp templates & staff pins.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Signup Box */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Step {step} of 2</span>
                <span className="text-xs text-slate-400">Instant Activation</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {step === 1 ? 'Store & Owner Profile' : 'Account Credentials & Security'}
              </h2>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleNext} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Laundry Business / Shop Name *
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. CleanSprint Laundry Hub"
                      value={formData.tenantName}
                      onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Business Type
                    </label>
                    <select
                      value={formData.businessType}
                      onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="LAUNDRY">Laundry & Wash</option>
                      <option value="DRY_CLEANING">Dry Cleaning & Press</option>
                      <option value="GARMENT_CARE">Complete Garment Care & Spa</option>
                      <option value="IRONING">Steam Ironing Service</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      First Branch Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Indiranagar Branch"
                      value={formData.branchName}
                      onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Owner Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Anand Kumar"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone / WhatsApp Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="+91 99000 11111"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Partner / Referral Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PARTNER-BLR-01"
                    value={formData.partnerCode}
                    onChange={(e) => setFormData({ ...formData, partnerCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-sm font-mono uppercase rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>Continue to Credentials</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Work Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="owner@cleansprint.in"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Password (Min 8 Chars) *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs space-y-1">
                  <p className="font-bold text-blue-900 dark:text-blue-300">Your Free Trial Summary:</p>
                  <p className="text-slate-600 dark:text-slate-400">
                    • 14 Days Full Professional Features (POS, QR Tags, WhatsApp)
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    • No credit card required. No automatic charges.
                  </p>
                </div>

                {/* Terms Acceptance */}
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="terms-signup"
                    required
                    checked={formData.acceptTerms}
                    onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                    className="mt-1 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="terms-signup" className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed cursor-pointer">
                    I agree to the{' '}
                    <Link href="/terms" className="text-blue-600 hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </label>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-extrabold text-sm shadow-md transition disabled:opacity-50"
                  >
                    {isLoading ? 'Setting Up Your Store...' : 'Complete & Start Free Trial'}
                  </button>
                </div>
              </form>
            )}

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
              Already registered?{' '}
              <Link href="/login" className="font-bold text-blue-600 hover:underline">
                Sign In to Shop Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
