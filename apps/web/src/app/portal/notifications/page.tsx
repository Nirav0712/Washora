'use client';

import React, { useEffect, useState } from 'react';
import { Bell, MessageSquare, Mail, Phone, Clock, AlertCircle } from 'lucide-react';
import { customerPortalApi } from '@/lib/api/customer-portal';

export default function CustomerNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await customerPortalApi.getNotifications();
        setNotifications(res.items || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load notifications');
      } finally {
        setIsLoading(false);
      }
    }
    loadNotifications();
  }, []);

  const getChannelIcon = (channel: string) => {
    switch (channel?.toUpperCase()) {
      case 'WHATSAPP':
        return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      case 'EMAIL':
        return <Mail className="w-4 h-4 text-blue-600" />;
      case 'SMS':
        return <Phone className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Notifications & Updates
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Messages sent via WhatsApp, SMS, and Email regarding your laundry orders
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white animate-pulse rounded-2xl border border-slate-200" />
          ))}
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
          {error}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
          <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No notifications yet</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated delivery, ready, and payment receipts will be recorded here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="divide-y divide-slate-100">
            {notifications.map((notif) => (
              <div key={notif.id} className="p-4 sm:p-5 flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                  {getChannelIcon(notif.channel)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      {notif.channel}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {new Date(notif.createdAt).toLocaleDateString()} at{' '}
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 font-medium mt-2 leading-relaxed whitespace-pre-line">
                    {notif.renderedContent}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
