'use client';

import React, { useState, useEffect } from 'react';
import { AdminShell } from '../../components/AdminShell';
import {
  LifeBuoy,
  Phone,
  Mail,
  Clock,
  MessageSquare,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  Send,
  Save,
  Filter,
} from 'lucide-react';

interface ContactSettings {
  serviceSupportNumber?: string;
  salesNumber?: string;
  companyConnectNumber?: string;
  supportEmail?: string;
  salesEmail?: string;
  whatsappNumber?: string;
  businessHours?: string;
}

interface TicketMessage {
  senderId: string;
  senderName: string;
  senderType: 'TENANT' | 'PLATFORM_ADMIN';
  message: string;
  createdAt: string;
}

interface PlatformTicket {
  _id: string;
  ticketNumber: string;
  tenantId: {
    _id: string;
    name: string;
    slug: string;
    email?: string;
    phone?: string;
    address?: string;
    gstNumber?: string;
  };
  createdBy: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  category: string;
  priority: string;
  status: string;
  subject: string;
  description: string;
  messages: TicketMessage[];
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PlatformSupportPage() {
  const [contactSettings, setContactSettings] = useState<ContactSettings>({
    serviceSupportNumber: '+91 80 4680 1100',
    salesNumber: '+91 80 4680 1101',
    companyConnectNumber: '+91 99000 88221',
    supportEmail: 'support@washora.com',
    salesEmail: 'sales@washora.com',
    whatsappNumber: '+91 99000 88221',
    businessHours: 'Monday - Saturday: 8:00 AM - 9:00 PM IST',
  });
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [contactSuccessMsg, setContactSuccessMsg] = useState('');

  const [tickets, setTickets] = useState<PlatformTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected ticket for modal
  const [selectedTicket, setSelectedTicket] = useState<PlatformTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const getAdminToken = () => {
    return localStorage.getItem('washora_platform_token') || localStorage.getItem('token') || '';
  };

  const fetchContactInfo = async () => {
    try {
      const token = getAdminToken();
      const res = await fetch('/api/platform/support/contact-info', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (data && !data.error) {
        setContactSettings(data);
      }
    } catch (err) {
      // ignore
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = getAdminToken();
      let url = '/api/platform/support/tickets?limit=100';
      if (statusFilter !== 'ALL') url += `&status=${statusFilter}`;
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (data?.items) {
        setTickets(data.items);
      }
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactInfo();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, searchQuery]);

  const handleSaveContactInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingContact(true);
      setContactSuccessMsg('');
      const token = getAdminToken();
      const res = await fetch('/api/platform/support/contact-info', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(contactSettings),
      });
      if (res.ok) {
        setContactSuccessMsg('Centralized support helplines broadcasted to all customer stores!');
        setTimeout(() => setContactSuccessMsg(''), 4000);
      }
    } catch (err) {
      // ignore
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleSendAdminReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;

    try {
      setIsSendingReply(true);
      const token = getAdminToken();
      const res = await fetch(`/api/platform/support/tickets/${selectedTicket._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: replyText.trim() }),
      });

      const updated = await res.json().catch(() => null);
      if (res.ok && updated) {
        setSelectedTicket((prev) => (prev ? { ...prev, messages: updated.messages, status: updated.status } : null));
        setReplyText('');
        fetchTickets();
      }
    } catch (err) {
      // ignore
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedTicket || !newStatus) return;

    try {
      setIsUpdatingStatus(true);
      const token = getAdminToken();
      const res = await fetch(`/api/platform/support/tickets/${selectedTicket._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          resolutionNotes: resolutionNotes.trim() || undefined,
        }),
      });

      const updated = await res.json().catch(() => null);
      if (res.ok && updated) {
        setSelectedTicket((prev) => (prev ? { ...prev, status: updated.status, resolutionNotes: updated.resolutionNotes } : null));
        fetchTickets();
      }
    } catch (err) {
      // ignore
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const openTicketModal = (t: PlatformTicket) => {
    setSelectedTicket(t);
    setNewStatus(t.status);
    setResolutionNotes(t.resolutionNotes || '');
    setReplyText('');
  };

  return (
    <AdminShell>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <LifeBuoy className="w-7 h-7 text-blue-600" />
            <span>Customer Support & Centralized Helplines</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage SaaS customer tickets across all tenant companies, resolve workstation issues, and configure official support contact lines.
          </p>
        </div>

        {/* Central Contact Information Configuration */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600" />
                <span>Centralized Platform Support & Sales Contact Settings</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                These contact lines are broadcasted in all shop owners' portals and invoices
              </p>
            </div>

            {contactSuccessMsg && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{contactSuccessMsg}</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveContactInfo} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Service Support Number
                </label>
                <input
                  type="text"
                  value={contactSettings.serviceSupportNumber || ''}
                  onChange={(e) => setContactSettings({ ...contactSettings, serviceSupportNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sales & Onboarding Number
                </label>
                <input
                  type="text"
                  value={contactSettings.salesNumber || ''}
                  onChange={(e) => setContactSettings({ ...contactSettings, salesNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  WhatsApp Support Helpline
                </label>
                <input
                  type="text"
                  value={contactSettings.whatsappNumber || ''}
                  onChange={(e) => setContactSettings({ ...contactSettings, whatsappNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Support Email Address
                </label>
                <input
                  type="email"
                  value={contactSettings.supportEmail || ''}
                  onChange={(e) => setContactSettings({ ...contactSettings, supportEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sales Email Address
                </label>
                <input
                  type="email"
                  value={contactSettings.salesEmail || ''}
                  onChange={(e) => setContactSettings({ ...contactSettings, salesEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Operating Hours
                </label>
                <input
                  type="text"
                  value={contactSettings.businessHours || ''}
                  onChange={(e) => setContactSettings({ ...contactSettings, businessHours: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingContact}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingContact ? 'Saving...' : 'Update & Broadcast Helplines'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Tickets Management Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto text-xs pb-1 sm:pb-0">
              {['ALL', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    statusFilter === st
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            <div className="w-full sm:w-72 relative text-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket #, tenant, subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading support tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No support tickets match the current filters</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50">
                    <th className="py-3 px-3">Ticket #</th>
                    <th className="py-3 px-3">Tenant / Shop</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Priority</th>
                    <th className="py-3 px-3">Subject</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.map((t) => (
                    <tr
                      key={t._id}
                      onClick={() => openTicketModal(t)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-blue-600">
                        {t.ticketNumber}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900">{t.tenantId?.name || 'Laundry Shop'}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">@{t.tenantId?.slug}</span>
                      </td>
                      <td className="py-3 px-3 uppercase tracking-wider text-[10px] font-semibold text-slate-600">
                        {t.category.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                          t.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900 max-w-xs truncate">
                        {t.subject}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          t.status === 'OPEN' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          t.status === 'CLOSED' ? 'bg-slate-100 text-slate-500' :
                          'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {t.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400 whitespace-nowrap">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Ticket Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-blue-600">{selectedTicket.ticketNumber}</span>
                    <span className="text-xs font-bold text-slate-700">&bull; {selectedTicket.tenantId?.name}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedTicket.subject}</h3>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* Status Update Bar */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">Ticket Status:</span>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-bold text-xs"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="WAITING_FOR_CUSTOMER">WAITING FOR CUSTOMER</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <input
                      type="text"
                      placeholder="Resolution notes..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      className="w-full px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                    <button
                      onClick={handleUpdateStatus}
                      disabled={isUpdatingStatus}
                      className="px-3 py-1 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800 shrink-0"
                    >
                      Update
                    </button>
                  </div>
                </div>

                {/* Conversation Thread */}
                <div className="space-y-3 max-h-72 overflow-y-auto p-1">
                  {selectedTicket.messages?.map((msg, idx) => {
                    const isAdmin = msg.senderType === 'PLATFORM_ADMIN';
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                          <span className="font-bold text-slate-700">
                            {isAdmin ? '🛡️ Washora Support Team' : msg.senderName || selectedTicket.tenantId?.name}
                          </span>
                          <span>&bull;</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div
                          className={`p-3 rounded-2xl max-w-md text-xs leading-relaxed shadow-sm ${
                            isAdmin
                              ? 'bg-blue-600 text-white rounded-tr-none'
                              : 'bg-slate-100 text-slate-900 rounded-tl-none border border-slate-200'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Composer */}
                <div className="pt-3 border-t border-slate-100 flex gap-2">
                  <input
                    type="text"
                    placeholder="Type official reply to the shop owner as Washora Support Engineer..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendAdminReply();
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={handleSendAdminReply}
                    disabled={isSendingReply || !replyText.trim()}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
