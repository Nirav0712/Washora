'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useApp } from '@/context/AppContext';
import {
  LifeBuoy,
  Phone,
  Mail,
  Clock,
  MessageSquare,
  Plus,
  Send,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Printer,
  CreditCard,
  ShieldAlert,
  Search,
  ExternalLink,
} from 'lucide-react';

interface TicketMessage {
  senderId: string;
  senderName: string;
  senderType: 'TENANT' | 'PLATFORM_ADMIN';
  message: string;
  attachments?: string[];
  createdAt: string;
}

interface SupportTicket {
  _id: string;
  ticketNumber: string;
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

interface ContactSettings {
  serviceSupportNumber?: string;
  salesNumber?: string;
  companyConnectNumber?: string;
  supportEmail?: string;
  salesEmail?: string;
  whatsappNumber?: string;
  businessHours?: string;
}

export default function SupportHelpdeskPage() {
  const { showNotification } = useApp();

  const [contactInfo, setContactInfo] = useState<ContactSettings>({
    serviceSupportNumber: '+91 80 4680 1100',
    salesNumber: '+91 80 4680 1101',
    companyConnectNumber: '+91 99000 88221',
    supportEmail: 'support@washora.com',
    whatsappNumber: '+91 99000 88221',
    businessHours: 'Monday - Saturday: 8:00 AM - 9:00 PM IST',
  });

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected ticket for conversation thread
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // New ticket modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCategory, setNewCategory] = useState('TECHNICAL');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchContactInfo = async () => {
    try {
      const res = await fetch('/api/support/contact-info');
      const data = await res.json().catch(() => null);
      if (data && !data.error) {
        setContactInfo(data);
      }
    } catch (err) {
      // ignore
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('washora_access_token') || localStorage.getItem('token');
      if (!token) return;

      let url = '/api/support/tickets?limit=50';
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

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) {
      showNotification('Please enter ticket subject and description', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('washora_access_token') || localStorage.getItem('token');
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: newCategory,
          priority: newPriority,
          subject: newSubject.trim(),
          description: newDescription.trim(),
        }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok) {
        showNotification(`Support ticket #${data.ticketNumber} created successfully`, 'success');
        setShowCreateModal(false);
        setNewSubject('');
        setNewDescription('');
        fetchTickets();
      } else {
        showNotification(data?.message || 'Failed to create support ticket', 'error');
      }
    } catch (err: any) {
      showNotification(err?.message || 'Error creating ticket', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;

    try {
      setIsSendingReply(true);
      const token = localStorage.getItem('washora_access_token') || localStorage.getItem('token');
      const res = await fetch(`/api/support/tickets/${selectedTicket._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: replyText.trim(),
        }),
      });

      const updated = await res.json().catch(() => null);
      if (res.ok && updated) {
        setSelectedTicket(updated);
        setReplyText('');
        showNotification('Message reply sent to Washora support', 'success');
        fetchTickets();
      } else {
        showNotification(updated?.message || 'Failed to send reply', 'error');
      }
    } catch (err: any) {
      showNotification(err?.message || 'Error sending reply', 'error');
    } finally {
      setIsSendingReply(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400">URGENT</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">HIGH</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">LOW</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">MEDIUM</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:border-amber-900/50 dark:text-amber-300">OPEN</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:border-blue-900/50 dark:text-blue-300">IN PROGRESS</span>;
      case 'WAITING_FOR_CUSTOMER':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/50 dark:border-purple-900/50 dark:text-purple-300">WAITING ACTION</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-900/50 dark:text-emerald-300">RESOLVED</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">CLOSED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-primary-600" />
            <span>Support Tickets & Helpdesk</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Connect directly with Washora laundry SaaS technical specialists, report workstation or printer issues, and track resolutions.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setShowCreateModal(true)}
        >
          Create Support Ticket
        </Button>
      </div>

      {/* Central Contact Cards Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <GlassCard className="p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 text-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Direct Helplines</p>
            <p className="font-bold text-slate-900 dark:text-white">{contactInfo.serviceSupportNumber}</p>
            <p className="text-[11px] text-slate-500">Sales: {contactInfo.salesNumber}</p>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 text-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">WhatsApp & Connect</p>
            <p className="font-bold text-slate-900 dark:text-white">{contactInfo.whatsappNumber}</p>
            <p className="text-[11px] text-slate-500">{contactInfo.supportEmail}</p>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 text-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Support Hours</p>
            <p className="font-bold text-slate-900 dark:text-white">{contactInfo.businessHours}</p>
            <p className="text-[11px] text-emerald-600 font-medium">Engineers on standby</p>
          </div>
        </GlassCard>
      </div>

      {/* Tickets Section */}
      <GlassCard className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs pb-1 sm:pb-0">
            {['ALL', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? 'bg-primary-600 text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-64 relative text-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ticket # or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Tickets Grid / List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading support tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <LifeBuoy className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No support tickets found</p>
            <p className="text-[11px] text-slate-400">Create a ticket if you need technical assistance or billing help</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {tickets.map((t) => (
              <div
                key={t._id}
                onClick={() => setSelectedTicket(t)}
                className="py-3.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors flex items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-primary-600 dark:text-primary-400">
                      {t.ticketNumber}
                    </span>
                    {getPriorityBadge(t.priority)}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {t.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {t.subject}
                  </h3>
                  <p className="text-xs text-slate-500 truncate max-w-xl">
                    {t.description}
                  </p>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <div>{getStatusBadge(t.status)}</div>
                  <p className="text-[10px] text-slate-400">
                    {t.messages?.length || 1} msg &bull; {new Date(t.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Ticket Details & In-App Conversation Modal */}
      {selectedTicket && (
        <Modal
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          title={`Ticket ${selectedTicket.ticketNumber} — ${selectedTicket.subject}`}
          size="lg"
        >
          <div className="space-y-4">
            {/* Ticket Meta */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200/60 dark:border-slate-700">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedTicket.status)}
                {getPriorityBadge(selectedTicket.priority)}
                <span className="font-bold text-slate-600 dark:text-slate-300">
                  Category: {selectedTicket.category.replace(/_/g, ' ')}
                </span>
              </div>
              <span className="text-slate-400">
                Created: {new Date(selectedTicket.createdAt).toLocaleString()}
              </span>
            </div>

            {/* Resolution Banner */}
            {selectedTicket.resolutionNotes && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
                <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Engineer Resolution Summary:</span>
                </p>
                <p className="text-emerald-700 dark:text-emerald-400">{selectedTicket.resolutionNotes}</p>
              </div>
            )}

            {/* Conversation Thread */}
            <div className="space-y-3 max-h-[360px] overflow-y-auto p-1">
              {selectedTicket.messages?.map((msg, idx) => {
                const isAdmin = msg.senderType === 'PLATFORM_ADMIN';
                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {isAdmin ? '🛡️ Washora Support Engineer' : msg.senderName || 'Your Shop Staff'}
                      </span>
                      <span>&bull;</span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`p-3 rounded-2xl max-w-lg text-xs leading-relaxed shadow-sm ${
                        isAdmin
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-slate-900 dark:text-slate-100 border border-blue-100 dark:border-blue-900/60 rounded-tl-none'
                          : 'bg-primary-600 text-white rounded-tr-none'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Composer */}
            {selectedTicket.status !== 'CLOSED' ? (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <Input
                  placeholder="Type reply or additional info for the support team..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                />
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isSendingReply || !replyText.trim()}
                  onClick={handleSendReply}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Send
                </Button>
              </div>
            ) : (
              <div className="text-center py-2 text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800">
                This support ticket has been closed. Create a new ticket if you need further assistance.
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Create Ticket Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Open Support Ticket"
        size="md"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category *
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="TECHNICAL">Technical / Workstation</option>
                <option value="HARDWARE_PRINTER">Thermal Printer & Scanner</option>
                <option value="BILLING">Billing & Invoices</option>
                <option value="SUBSCRIPTION">SaaS Subscription & Plan</option>
                <option value="FEATURE_REQUEST">Feature Request</option>
                <option value="OTHER">Other Query</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Urgency / Priority *
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="LOW">Low (General guidance)</option>
                <option value="MEDIUM">Medium (Standard query)</option>
                <option value="HIGH">High (Impacts billing / store)</option>
                <option value="URGENT">Urgent (Counter halted)</option>
              </select>
            </div>
          </div>

          <Input
            label="Subject Summary *"
            placeholder="e.g. Koramangala barcode scanner not recognized in Chrome"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Detailed Description *
            </label>
            <textarea
              rows={4}
              placeholder="Describe the issue, step-by-step reproduction, and workstation details..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Support Ticket'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
