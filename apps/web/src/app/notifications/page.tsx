'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  Eye,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Sliders,
  Settings,
  FileText,
  Smartphone,
  CheckCheck,
  XCircle,
  ChevronRight,
  User,
  Package,
} from 'lucide-react';
import {
  NotificationRecord,
  NotificationStats,
  NotificationChannel,
  NotificationEventType,
  NotificationStatus,
} from '@washora/shared';
import { notificationsApi } from '@/lib/api/notifications';

export default function NotificationsAdminPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedEvent, setSelectedEvent] = useState<string>('ALL');

  // Detail Modal State
  const [selectedNotif, setSelectedNotif] = useState<NotificationRecord | null>(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, [page, selectedChannel, selectedStatus, selectedEvent]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [listRes, statsRes] = await Promise.all([
        notificationsApi.list({
          page,
          limit: 20,
          channel: selectedChannel !== 'ALL' ? (selectedChannel as NotificationChannel) : undefined,
          status: selectedStatus !== 'ALL' ? (selectedStatus as NotificationStatus) : undefined,
          eventType: selectedEvent !== 'ALL' ? (selectedEvent as NotificationEventType) : undefined,
          search: search.trim() || undefined,
        }),
        notificationsApi.getStats(),
      ]);

      const resData = (listRes as any)?.data?.data || (listRes as any)?.data || listRes;
      const resMeta = (listRes as any)?.data?.meta || (listRes as any)?.meta;

      if (Array.isArray(resData)) {
        setNotifications(resData);
      }
      if (resMeta?.total !== undefined) {
        setTotal(resMeta.total);
      }
      if (statsRes) {
        setStats((statsRes as any).data || statsRes);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleResend = async (id: string) => {
    try {
      setResending(true);
      setResendSuccess(false);
      const res = await notificationsApi.resend(id);
      const updated = (res as any)?.data || res;
      if (updated) {
        setSelectedNotif(updated);
        setResendSuccess(true);
        loadData();
      }
    } catch (err) {
      console.error('Failed to resend notification', err);
    } finally {
      setResending(false);
    }
  };

  const getStatusBadge = (status: NotificationStatus) => {
    switch (status) {
      case NotificationStatus.SENT:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Send className="h-3 w-3" /> Sent
          </span>
        );
      case NotificationStatus.DELIVERED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCheck className="h-3 w-3" /> Delivered
          </span>
        );
      case NotificationStatus.READ:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Eye className="h-3 w-3 text-indigo-500" /> Read
          </span>
        );
      case NotificationStatus.QUEUED:
      case NotificationStatus.PROCESSING:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <Clock className="h-3 w-3" /> Queued
          </span>
        );
      case NotificationStatus.FAILED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="h-3 w-3" /> Failed
          </span>
        );
      case NotificationStatus.SKIPPED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Skipped
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const getChannelIcon = (channel: NotificationChannel) => {
    switch (channel) {
      case NotificationChannel.WHATSAPP:
        return <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded"><Smartphone className="h-3 w-3" /> WhatsApp</span>;
      case NotificationChannel.SMS:
        return <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded"><MessageSquare className="h-3 w-3" /> SMS</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded">{channel}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-emerald-600" />
            Customer Communications & WhatsApp Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time transactional customer updates, notification history, delivery tracking, and WhatsApp templates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/settings/notifications/automation"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-sm"
          >
            <Sliders className="h-4 w-4 text-slate-500" />
            Automations
          </a>
          <a
            href="/settings/notifications/templates"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-sm"
          >
            <FileText className="h-4 w-4 text-slate-500" />
            Templates
          </a>
          <a
            href="/settings/notifications/whatsapp"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
          >
            <Settings className="h-4 w-4" />
            WhatsApp Setup
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Total Logged</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats?.total || 0}</div>
          <span className="text-xs text-slate-500 mt-1 inline-block">All time</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Queued</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">{stats?.queued || 0}</div>
          <span className="text-xs text-amber-600 font-medium mt-1 inline-block">In dispatch queue</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Sent</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats?.sent || 0}</div>
          <span className="text-xs text-blue-600 font-medium mt-1 inline-block">Accepted by provider</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Delivered</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{stats?.delivered || 0}</div>
          <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">Phone confirmed</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Read</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{stats?.read || 0}</div>
          <span className="text-xs text-indigo-600 font-medium mt-1 inline-block">Blue ticks confirmed</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Failed</span>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats?.failed || 0}</div>
          <span className="text-xs text-red-600 font-medium mt-1 inline-block">Errors / Invalid</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by phone, recipient, or text snippet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Channel filter */}
          <select
            value={selectedChannel}
            onChange={(e) => {
              setSelectedChannel(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Channels</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="SMS">SMS</option>
            <option value="EMAIL">Email</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="SENT">Sent</option>
            <option value="DELIVERED">Delivered</option>
            <option value="READ">Read</option>
            <option value="QUEUED">Queued</option>
            <option value="FAILED">Failed</option>
            <option value="SKIPPED">Skipped</option>
          </select>

          {/* Event Type filter */}
          <select
            value={selectedEvent}
            onChange={(e) => {
              setSelectedEvent(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Events</option>
            <option value="ORDER_CREATED">Order Created</option>
            <option value="ORDER_READY">Order Ready</option>
            <option value="ORDER_CANCELLED">Order Cancelled</option>
            <option value="PICKUP_SCHEDULED">Pickup Scheduled</option>
            <option value="PICKUP_OUT_FOR_PICKUP">Out For Pickup</option>
            <option value="PICKUP_COMPLETED">Pickup Completed</option>
            <option value="DELIVERY_SCHEDULED">Delivery Scheduled</option>
            <option value="DELIVERY_OUT_FOR_DELIVERY">Out For Delivery</option>
            <option value="DELIVERY_COMPLETED">Delivered</option>
            <option value="PAYMENT_RECEIVED">Payment Received</option>
          </select>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
              <span>Loading customer communications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No customer communication records found matching the current filters.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id || notif._id}
                onClick={() => {
                  setSelectedNotif(notif);
                  setResendSuccess(false);
                }}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 cursor-pointer transition-colors"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getChannelIcon(notif.channel)}
                    <span className="font-semibold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {notif.eventType}
                    </span>
                    {getStatusBadge(notif.status)}
                    {notif.providerMessageId && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        {notif.providerMessageId.slice(0, 18)}...
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-700">
                    <span className="font-medium flex items-center gap-1">
                      <User className="h-3 w-3 text-slate-400" />
                      {(notif.customer as any)?.name || 'Customer'}: <span className="font-semibold text-slate-900">{notif.recipient}</span>
                    </span>
                    {(notif.order as any)?.orderNumber && (
                      <span className="text-slate-500 flex items-center gap-1">
                        <Package className="h-3 w-3 text-slate-400" />
                        Order #{(notif.order as any)?.orderNumber}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-1 bg-slate-50 p-1.5 rounded border border-slate-100">
                    {notif.renderedContent}
                  </p>
                </div>

                <div className="text-right text-xs space-y-1 md:min-w-[150px]">
                  <div className="text-slate-500">
                    {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} • {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : ''}
                  </div>
                  {notif.deliveredAt && (
                    <div className="text-emerald-600 font-medium text-[11px]">
                      Delivered: {new Date(notif.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  {notif.readAt && (
                    <div className="text-indigo-600 font-medium text-[11px]">
                      Read: {new Date(notif.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  {notif.errorCode && (
                    <div className="text-red-600 font-medium text-[11px]">
                      Err: {notif.errorCode}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {notifications.length} of {total} records
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 bg-white border border-slate-200 rounded disabled:opacity-40"
            >
              Previous
            </button>
            <span>Page {page}</span>
            <button
              disabled={notifications.length < 20}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 bg-white border border-slate-200 rounded disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Detail / Resend Modal */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-600" />
                Notification Details
              </h3>
              <button
                onClick={() => setSelectedNotif(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕ Close
              </button>
            </div>

            {resendSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Message resent successfully!
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 block font-medium">Event Type</span>
                  <span className="font-semibold text-slate-900">{selectedNotif.eventType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Channel & Status</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {getChannelIcon(selectedNotif.channel)}
                    {getStatusBadge(selectedNotif.status)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Recipient Phone</span>
                  <span className="font-semibold text-slate-900">{selectedNotif.recipient}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Customer Name</span>
                  <span className="font-semibold text-slate-900">{(selectedNotif.customer as any)?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Template Key</span>
                  <span className="font-mono text-slate-700">{selectedNotif.templateKey || 'default'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Attempts</span>
                  <span className="font-semibold text-slate-900">{selectedNotif.attemptCount || 1}</span>
                </div>
              </div>

              {/* Message Content Preview */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Rendered Content Dispatched</label>
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl text-slate-800 font-sans whitespace-pre-wrap leading-relaxed">
                  {selectedNotif.renderedContent}
                </div>
              </div>

              {/* Provider Info */}
              {selectedNotif.providerMessageId && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1 font-mono text-[11px]">
                  <div className="text-slate-400">Meta Message ID:</div>
                  <div className="text-slate-800 break-all">{selectedNotif.providerMessageId}</div>
                </div>
              )}

              {/* Failure Error if any */}
              {selectedNotif.errorCode && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl space-y-1">
                  <div className="font-semibold flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> Provider Error: {selectedNotif.errorCode}
                  </div>
                  <div className="text-[11px]">{selectedNotif.errorMessage}</div>
                </div>
              )}

              {/* Timeline details */}
              <div className="space-y-1 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <div>Created At: {selectedNotif.createdAt ? new Date(selectedNotif.createdAt).toLocaleString() : 'N/A'}</div>
                {selectedNotif.sentAt && <div>Sent to Provider: {new Date(selectedNotif.sentAt).toLocaleString()}</div>}
                {selectedNotif.deliveredAt && <div className="text-emerald-600 font-medium">Delivered to Handset: {new Date(selectedNotif.deliveredAt).toLocaleString()}</div>}
                {selectedNotif.readAt && <div className="text-indigo-600 font-medium">Read by Customer: {new Date(selectedNotif.readAt).toLocaleString()}</div>}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedNotif(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                disabled={resending}
                onClick={() => handleResend(selectedNotif.id || selectedNotif._id!)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1.5 disabled:opacity-50"
              >
                {resending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Resend Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
