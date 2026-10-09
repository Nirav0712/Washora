'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Tag,
  Smartphone,
  ShieldCheck,
  Search,
  ArrowLeft,
} from 'lucide-react';
import {
  NotificationTemplate,
  NotificationEventType,
  NotificationChannel,
  WhatsAppCategory,
  TemplateStatus,
} from '@washora/shared';
import { notificationTemplatesApi } from '@/lib/api/notification-templates';

const AVAILABLE_VARIABLES = [
  'customerName',
  'orderNumber',
  'totalAmount',
  'paidAmount',
  'dueAmount',
  'pickupDate',
  'pickupTime',
  'deliveryDate',
  'deliveryTime',
  'agentName',
  'shopName',
  'branchName',
  'invoiceNumber',
  'failureReason',
  'pickupNumber',
  'deliveryNumber',
  'paymentAmount',
];

export default function TemplatesSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal Create/Edit State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    eventType: NotificationEventType.ORDER_CREATED,
    channel: NotificationChannel.WHATSAPP,
    templateKey: '',
    providerTemplateId: '',
    language: 'en_US',
    category: WhatsAppCategory.UTILITY,
    content: '',
    isDefault: true,
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const res = await notificationTemplatesApi.list();
      const list = (res as any)?.data || res;
      if (Array.isArray(list)) setTemplates(list);
    } catch (err) {
      console.error('Failed to load templates', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      eventType: NotificationEventType.ORDER_CREATED,
      channel: NotificationChannel.WHATSAPP,
      templateKey: '',
      providerTemplateId: '',
      language: 'en_US',
      category: WhatsAppCategory.UTILITY,
      content: 'Hello {{customerName}}, your order {{orderNumber}} is confirmed at {{shopName}}.',
      isDefault: true,
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (tpl: NotificationTemplate) => {
    setEditingTemplate(tpl);
    setFormData({
      name: tpl.name,
      eventType: tpl.eventType,
      channel: tpl.channel,
      templateKey: tpl.templateKey,
      providerTemplateId: tpl.providerTemplateId || '',
      language: tpl.language || 'en_US',
      category: tpl.category || WhatsAppCategory.UTILITY,
      content: tpl.content,
      isDefault: tpl.isDefault,
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const insertVariable = (varName: string) => {
    setFormData((prev) => ({
      ...prev,
      content: `${prev.content} {{${varName}}}`,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg('');

      if (editingTemplate) {
        await notificationTemplatesApi.update(editingTemplate.id || (editingTemplate as any)._id, formData);
      } else {
        await notificationTemplatesApi.create(formData);
      }

      setModalOpen(false);
      loadTemplates();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save template. Ensure variables are valid.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (tpl: NotificationTemplate) => {
    const tplId = tpl.id || (tpl as any)._id;
    try {
      if (tpl.isActive) {
        await notificationTemplatesApi.disable(tplId);
      } else {
        await notificationTemplatesApi.enable(tplId);
      }
      loadTemplates();
    } catch (err) {
      console.error('Failed to toggle template status', err);
    }
  };

  const filteredTemplates = templates.filter((t) => {
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.templateKey.toLowerCase().includes(search.toLowerCase()) ||
      t.content.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <a href="/notifications" className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Communications
            </a>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs font-semibold text-slate-700">Templates</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="h-7 w-7 text-emerald-600" />
            Notification & WhatsApp Templates
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage transactional messaging templates, dynamic variables, and Meta approved WhatsApp template mapping.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Create Template
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search templates by name, key, or text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          {filteredTemplates.length} Templates Configured
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
          <span>Loading templates...</span>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="p-12 bg-white rounded-xl border border-slate-200 text-center text-slate-400">
          No custom templates created yet. System default templates will be used for all events automatically.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.id || (tpl as any)._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                    {tpl.eventType}
                  </span>
                  <div className="flex items-center gap-2">
                    {tpl.isDefault && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">
                        Default
                      </span>
                    )}
                    <button
                      onClick={() => toggleActive(tpl)}
                      className={`text-xs px-2 py-0.5 rounded font-semibold transition-colors ${
                        tpl.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {tpl.isActive ? 'ACTIVE' : 'DISABLED'}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">{tpl.name}</h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">key: {tpl.templateKey}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 whitespace-pre-wrap leading-relaxed border border-slate-100/80 font-sans">
                  {tpl.content}
                </div>

                {tpl.variables && tpl.variables.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {tpl.variables.map((v) => (
                      <span key={v} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono">
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  {tpl.providerTemplateId ? `Meta ID: ${tpl.providerTemplateId}` : 'Text Template'}
                </div>
                <button
                  onClick={() => openEditModal(tpl)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  <Edit2 className="h-3 w-3" /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingTemplate ? 'Edit Notification Template' : 'Create Notification Template'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-semibold text-sm"
              >
                ✕ Close
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Template Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Order Ready Pickup Alert"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unique Template Key</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingTemplate}
                    placeholder="e.g. order_ready_custom"
                    value={formData.templateKey}
                    onChange={(e) => setFormData({ ...formData, templateKey: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Event Type</label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value as NotificationEventType })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    {Object.values(NotificationEventType).map((ev) => (
                      <option key={ev} value={ev}>{ev}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Channel</label>
                  <select
                    value={formData.channel}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value as NotificationChannel })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value={NotificationChannel.WHATSAPP}>WhatsApp</option>
                    <option value={NotificationChannel.SMS}>SMS</option>
                    <option value={NotificationChannel.EMAIL}>Email</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Language</label>
                  <input
                    type="text"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                    placeholder="en_US"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Meta WhatsApp Provider Template ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. order_ready_notification_v2"
                  value={formData.providerTemplateId}
                  onChange={(e) => setFormData({ ...formData, providerTemplateId: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              {/* Variable Insertion Chips */}
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="block font-semibold text-slate-600 text-[11px]">Click to insert variable into template:</span>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_VARIABLES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] text-emerald-700 font-mono hover:bg-emerald-50 hover:border-emerald-200"
                    >
                      {`+ {{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Content */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Message Content</label>
                <textarea
                  required
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-sans focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Type your message text with {{variables}}..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefaultCheckbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isDefaultCheckbox" className="font-medium text-slate-700">
                  Set as default template for this event
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <RefreshCw className="h-3 w-3 animate-spin" />}
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
