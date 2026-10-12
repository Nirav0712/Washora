'use client';

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  ArrowLeft,
  Sliders,
  FileText,
  AlertCircle,
  Link,
  Send,
} from 'lucide-react';
import { WhatsAppSettings } from '@washora/shared';
import { notificationSettingsApi } from '@/lib/api/notification-settings';

export default function WhatsAppSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showToken, setShowToken] = useState(false);

  const [formData, setFormData] = useState({
    enabled: false,
    provider: 'META_OFFICIAL',
    phoneNumberId: '',
    businessAccountId: '',
    accessToken: '',
    webhookEnabled: false,
    webhookVerifyToken: '',
    defaultLanguage: 'en_US',
  });

  const defaultApiBase = process.env.NODE_ENV === 'production'
    ? 'https://deeppink-ibis-194201.hostingersite.com/api'
    : 'http://localhost:4000/api';
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || defaultApiBase).replace(/\/+$/, '');
  const webhookCallbackUrl = `${apiBase}/notifications/webhooks/whatsapp`;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await notificationSettingsApi.getWhatsAppSettings();
      const data = (res as any)?.data || res;
      if (data) {
        setFormData({
          enabled: !!data.enabled,
          provider: data.provider || 'META_OFFICIAL',
          phoneNumberId: data.phoneNumberId || '',
          businessAccountId: data.businessAccountId || '',
          accessToken: data.accessTokenReference || '',
          webhookEnabled: !!data.webhookEnabled,
          webhookVerifyToken: data.webhookVerifyTokenReference || '',
          defaultLanguage: data.defaultLanguage || 'en_US',
        });
      }
    } catch (err) {
      console.error('Failed to load WhatsApp settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMsg('');
      setErrorMsg('');

      const res = await notificationSettingsApi.updateWhatsAppSettings(formData);
      const data = (res as any)?.data || res;
      if (data) {
        setFormData((prev) => ({
          ...prev,
          accessToken: data.accessTokenReference || prev.accessToken,
        }));
        setSuccessMsg('WhatsApp settings saved successfully!');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update WhatsApp settings');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMsg('Webhook URL copied to clipboard!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <a href="/notifications" className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Communications
          </a>
          <span className="text-xs text-slate-400">/</span>
          <span className="text-xs font-semibold text-slate-700">WhatsApp Setup</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Smartphone className="h-7 w-7 text-emerald-600" />
          WhatsApp Business API Configuration
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Connect your official Meta WhatsApp Business Cloud API account to dispatch automated laundry notifications.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
          <span>Loading settings...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Enable Switch Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                Enable WhatsApp Automation
                {formData.enabled ? (
                  <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">ACTIVE</span>
                ) : (
                  <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">INACTIVE</span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                When enabled, triggered lifecycle events will automatically dispatch customer notifications via WhatsApp.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Credentials Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Meta Cloud API Credentials
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number ID</label>
                <input
                  type="text"
                  placeholder="e.g. 10928374659201"
                  value={formData.phoneNumberId}
                  onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">WhatsApp Business Account ID</label>
                <input
                  type="text"
                  placeholder="e.g. 98765432109876"
                  value={formData.businessAccountId}
                  onChange={(e) => setFormData({ ...formData, businessAccountId: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Permanent Meta Access Token</label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  placeholder="EAAG... (System User Access Token)"
                  value={formData.accessToken}
                  onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                  className="w-full p-2.5 pr-10 border border-slate-200 rounded-lg font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Never shared publicly. Existing tokens are automatically masked for security.
              </span>
            </div>
          </div>

          {/* Webhook Configuration Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Link className="h-4 w-4 text-emerald-600" />
              Meta Status & Read Webhook Endpoint
            </h3>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Webhook Callback URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookCallbackUrl}
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-600 select-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(webhookCallbackUrl)}
                  className="px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 flex items-center gap-1 font-semibold text-slate-700"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </button>
              </div>
              <span className="text-[11px] text-slate-400">
                Paste this into Meta App Dashboard ➔ WhatsApp ➔ Configuration ➔ Webhook URL.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Verify Token</label>
              <input
                type="text"
                placeholder="e.g. washora_meta_verify_token"
                value={formData.webhookVerifyToken}
                onChange={(e) => setFormData({ ...formData, webhookVerifyToken: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg font-mono text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
              Save Configuration
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
