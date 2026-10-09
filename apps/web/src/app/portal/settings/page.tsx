'use client';

import React, { useEffect, useState } from 'react';
import {
  User,
  Bell,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { customerPortalApi } from '@/lib/api/customer-portal';
import { useCustomerAuth } from '@/context/CustomerAuthContext';

export default function CustomerSettingsPage() {
  const { customer, refreshSession } = useCustomerAuth();

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    preferredLanguage: 'en',
  });

  const [preferences, setPreferences] = useState({
    transactional: { whatsapp: true, email: true, sms: true },
    marketing: { whatsapp: false, email: false, sms: false },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [prof, prefs] = await Promise.all([
          customerPortalApi.getProfile(),
          customerPortalApi.getPreferences(),
        ]);
        if (prof?.customer) {
          setProfileForm({
            name: prof.customer.name || '',
            email: prof.customer.email || '',
            preferredLanguage: prof.customer.preferredLanguage || 'en',
          });
        }
        if (prefs) {
          setPreferences({
            transactional: prefs.transactional || { whatsapp: true, email: true, sms: true },
            marketing: prefs.marketing || { whatsapp: false, email: false, sms: false },
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await customerPortalApi.updateProfile(profileForm);
      await refreshSession();
      setSuccessMsg('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsSavingPrefs(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await customerPortalApi.updatePreferences(preferences);
      setSuccessMsg('Communication preferences updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update preferences');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-white animate-pulse rounded-2xl border border-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Account Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage your personal details and communication preferences
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          <span>Personal Information</span>
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Phone Number (Registered)
            </label>
            <input
              type="text"
              disabled
              value={customer?.phone || ''}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-500 cursor-not-allowed"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              To update your primary phone number, contact shop staff for identity re-verification.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              {isSavingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>

      {/* Communication Preferences Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan-600" />
          <span>Communication Channels</span>
        </h2>

        {/* Transactional Notifications */}
        <div>
          <h3 className="text-xs font-bold text-slate-800 mb-1">
            Order & Delivery Updates (Transactional)
          </h3>
          <p className="text-[11px] text-slate-400 mb-3">
            Important messages about garment status, order readiness, delivery OTPs, and invoices.
          </p>

          <div className="space-y-2.5">
            <label className="flex items-center gap-3 text-xs text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={preferences.transactional.whatsapp}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    transactional: { ...preferences.transactional, whatsapp: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span>WhatsApp Alerts (Recommended)</span>
            </label>

            <label className="flex items-center gap-3 text-xs text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={preferences.transactional.sms}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    transactional: { ...preferences.transactional, sms: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span>SMS Notifications</span>
            </label>

            <label className="flex items-center gap-3 text-xs text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={preferences.transactional.email}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    transactional: { ...preferences.transactional, email: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span>Email Invoices & Receipts</span>
            </label>
          </div>
        </div>

        {/* Marketing Notifications */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 mb-1">
            Special Offers & Seasonal Discounts (Optional)
          </h3>
          <p className="text-[11px] text-slate-400 mb-3">
            Promotional coupons, festival discounts, and dry cleaning specials.
          </p>

          <div className="space-y-2.5">
            <label className="flex items-center gap-3 text-xs text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={preferences.marketing.whatsapp}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    marketing: { ...preferences.marketing, whatsapp: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span>Promotional WhatsApp Messages</span>
            </label>

            <label className="flex items-center gap-3 text-xs text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={preferences.marketing.email}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    marketing: { ...preferences.marketing, email: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span>Promotional Emails & Newsletters</span>
            </label>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSavePreferences}
            disabled={isSavingPrefs}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
          >
            {isSavingPrefs ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
}
