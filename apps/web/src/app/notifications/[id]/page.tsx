'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  MessageSquare,
  ArrowLeft,
  Send,
  CheckCheck,
  Eye,
  Clock,
  XCircle,
  Smartphone,
  RefreshCw,
  User,
  Package,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  NotificationRecord,
  NotificationChannel,
  NotificationStatus,
} from '@washora/shared';
import { notificationsApi } from '@/lib/api/notifications';

export default function NotificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationRecord | null>(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      loadNotification();
    }
  }, [id]);

  const loadNotification = async () => {
    try {
      setLoading(true);
      const res = await notificationsApi.getById(id);
      const data = (res as any)?.data || res;
      setNotification(data);
    } catch (err) {
      console.error('Failed to load notification details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!id) return;
    try {
      setResending(true);
      setResendSuccess(false);
      const res = await notificationsApi.resend(id);
      const updated = (res as any)?.data || res;
      if (updated) {
        setNotification(updated);
        setResendSuccess(true);
      }
    } catch (err) {
      console.error('Failed to resend notification', err);
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
        <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
        <span>Loading notification details...</span>
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="p-12 text-center text-slate-500 space-y-4">
        <p>Notification record not found.</p>
        <button
          onClick={() => router.push('/notifications')}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
        >
          Back to Communications
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push('/notifications')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to All Notifications
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-emerald-600" />
            Notification Record
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1">ID: {notification.id || notification._id}</p>
        </div>

        <button
          onClick={handleResend}
          disabled={resending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
        >
          {resending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Resend Message
        </button>
      </div>

      {resendSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> Message resent successfully!
        </div>
      )}

      {/* Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl text-xs">
          <div>
            <span className="text-slate-400 block">Event Type</span>
            <span className="font-bold text-slate-900">{notification.eventType}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Channel</span>
            <span className="font-bold text-emerald-700">{notification.channel}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Status</span>
            <span className="font-bold text-slate-900">{notification.status}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Attempts</span>
            <span className="font-bold text-slate-900">{notification.attemptCount || 1}</span>
          </div>
        </div>

        {/* Recipient & Customer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 border border-slate-200 rounded-xl space-y-2">
            <h4 className="font-semibold text-slate-900 flex items-center gap-1.5">
              <User className="h-4 w-4 text-slate-500" />
              Customer Information
            </h4>
            <div className="text-slate-700">Name: <span className="font-medium">{(notification.customer as any)?.name || 'N/A'}</span></div>
            <div className="text-slate-700">Recipient: <span className="font-medium">{notification.recipient}</span></div>
          </div>

          <div className="p-4 border border-slate-200 rounded-xl space-y-2">
            <h4 className="font-semibold text-slate-900 flex items-center gap-1.5">
              <Package className="h-4 w-4 text-slate-500" />
              Associated Order
            </h4>
            <div className="text-slate-700">Order Number: <span className="font-medium">{(notification.order as any)?.orderNumber || 'N/A'}</span></div>
            <div className="text-slate-700">Template Key: <span className="font-mono text-slate-600">{notification.templateKey || 'default'}</span></div>
          </div>
        </div>

        {/* Rendered Text */}
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-900 text-xs">Rendered Message Content</h4>
          <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl text-slate-800 text-sm whitespace-pre-wrap leading-relaxed">
            {notification.renderedContent}
          </div>
        </div>

        {/* Variables Table */}
        {notification.variables && Object.keys(notification.variables).length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900 text-xs">Template Dynamic Variables</h4>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-200/60 pb-1">
                    <th className="pb-1">Variable Name</th>
                    <th className="pb-1">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(notification.variables).map(([k, v]) => (
                    <tr key={k}>
                      <td className="py-1 font-mono text-slate-600">{`{{${k}}}`}</td>
                      <td className="py-1 font-semibold text-slate-900">{String(v)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Provider Message ID */}
        {notification.providerMessageId && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 font-mono text-xs">
            <div className="text-slate-400">Meta / Provider Message ID:</div>
            <div className="text-slate-900 font-semibold break-all">{notification.providerMessageId}</div>
          </div>
        )}

        {/* Timestamps */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-slate-500">
          <div>
            <span className="block text-slate-400">Created At</span>
            {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : 'N/A'}
          </div>
          <div>
            <span className="block text-slate-400">Sent At</span>
            {notification.sentAt ? new Date(notification.sentAt).toLocaleString() : 'N/A'}
          </div>
          <div>
            <span className="block text-slate-400">Delivered At</span>
            {notification.deliveredAt ? new Date(notification.deliveredAt).toLocaleString() : 'N/A'}
          </div>
          <div>
            <span className="block text-slate-400">Read At</span>
            {notification.readAt ? new Date(notification.readAt).toLocaleString() : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
}
