'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  CreditCard,
  FileText,
  Truck,
  Bell,
  Clock,
  StickyNote,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { customersApi } from '@/lib/api/customers';

export default function CustomerProfileCRMPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ORDERS' | 'PAYMENTS' | 'INVOICES' | 'ADDRESSES' | 'LOGISTICS' | 'NOTES' | 'ACTIVITY'>('OVERVIEW');
  const [data, setData] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!customerId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [overviewRes, notesRes, activityRes] = await Promise.all([
        customersApi.getOverview(customerId),
        customersApi.getNotes(customerId).catch(() => []),
        customersApi.getActivity(customerId).catch(() => []),
      ]);
      setData(overviewRes);
      setNotes(notesRes || []);
      setActivity(activityRes || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load customer profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [customerId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setIsSavingNote(true);
    try {
      await customersApi.addNote(customerId, { content: newNote.trim() });
      setNewNote('');
      const updatedNotes = await customersApi.getNotes(customerId);
      setNotes(updatedNotes || []);
    } catch (err: any) {
      alert(err.message || 'Failed to add note');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this internal note?')) return;
    try {
      await customersApi.deleteNote(customerId, noteId);
      setNotes(notes.filter((n) => (n._id || n.id) !== noteId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete note');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-32 bg-slate-200 animate-pulse rounded-lg" />
        <div className="h-44 bg-white animate-pulse rounded-2xl border border-slate-200" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 space-y-4">
        <button
          onClick={() => router.push('/customers')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </button>
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-medium flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error || 'Customer not found.'}</p>
        </div>
      </div>
    );
  }

  const customer = data.customer;
  const kpis = data.kpis || {};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/customers')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-black text-xl shadow-md">
              {customer.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {customer.name}
                </h1>
                {customer.isVip && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-300">
                    VIP
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                  {customer.customerCode || 'CUST'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>{customer.phone}</span>
                </span>
                {customer.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{customer.email}</span>
                  </span>
                )}
                <span>
                  Member since {new Date(customer.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/pos?customerId=${customer._id || customer.id}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Create Order</span>
            </Link>
          </div>
        </div>

        {/* Operational KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders</span>
            <p className="text-xl font-black text-slate-900 mt-1">{kpis.totalOrders ?? 0}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Spent</span>
            <p className="text-xl font-black text-emerald-600 mt-1">₹{kpis.totalSpent ?? 0}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding</span>
            <p className="text-xl font-black text-amber-600 mt-1">₹{kpis.outstanding ?? 0}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Orders</span>
            <p className="text-xl font-black text-blue-600 mt-1">{kpis.activeOrders ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { label: 'Overview', key: 'OVERVIEW' },
          { label: 'Orders', key: 'ORDERS' },
          { label: 'Payments', key: 'PAYMENTS' },
          { label: 'Addresses', key: 'ADDRESSES' },
          { label: 'Notes', key: 'NOTES' },
          { label: 'Activity Timeline', key: 'ACTIVITY' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === t.key
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span>Recent Orders</span>
            </h3>
            <div className="divide-y divide-slate-100">
              {(data.recentOrders || []).map((o: any) => (
                <div key={o._id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-900">#{o.orderNumber}</span>
                    <p className="text-[11px] text-slate-400">
                      {new Date(o.createdAt).toLocaleDateString()} • {o.itemCount} items
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">₹{o.grandTotal}</span>
                    <span className="block text-[10px] uppercase font-bold text-blue-600">{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Saved Addresses */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-600" />
              <span>Addresses ({customer.addresses?.length || 0})</span>
            </h3>
            <div className="space-y-2.5">
              {(customer.addresses || []).map((a: any) => (
                <div key={a._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>{a.label || 'Address'}</span>
                    {a.isDefault && (
                      <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 mt-1">{a.addressLine1}, {a.city} {a.pincode}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'NOTES' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-amber-600" />
            <span>Internal Staff Notes (Hidden from Customer)</span>
          </h3>

          <form onSubmit={handleAddNote} className="space-y-3">
            <textarea
              required
              rows={3}
              placeholder="Add internal observations, special garment handling preferences, customer feedback..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSavingNote}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
              >
                {isSavingNote ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Add Internal Note</span>
              </button>
            </div>
          </form>

          <div className="divide-y divide-slate-100 pt-2">
            {notes.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No internal notes for this customer yet.</p>
            ) : (
              notes.map((n) => (
                <div key={n._id || n.id} className="py-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-800 font-medium whitespace-pre-wrap">{n.content}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Added by <strong className="text-slate-600">{n.authorName || 'Staff'}</strong> on{' '}
                      {new Date(n.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(n._id || n.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'ACTIVITY' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Customer 360 Activity Timeline</span>
          </h3>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {activity.map((ev, i) => (
              <div key={ev.id || i} className="relative">
                <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white" />
                <div>
                  <p className="text-xs font-bold text-slate-900">{ev.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{ev.description}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(ev.timestamp).toLocaleDateString()} at{' '}
                    {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'ORDERS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Orders ({data.recentOrders?.length || 0})
          </h3>
          <div className="divide-y divide-slate-100">
            {(data.recentOrders || []).map((o: any) => (
              <div key={o._id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-slate-900">#{o.orderNumber}</span>
                  <p className="text-slate-400">{new Date(o.createdAt).toLocaleDateString()} • {o.itemCount} items</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900">₹{o.grandTotal}</span>
                  <span className="block text-[10px] font-bold text-blue-600 uppercase">{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'PAYMENTS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Payments ({data.recentPayments?.length || 0})
          </h3>
          <div className="divide-y divide-slate-100">
            {(data.recentPayments || []).map((p: any) => (
              <div key={p._id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-slate-900">{p.paymentNumber}</span>
                  <p className="text-slate-400">{new Date(p.createdAt).toLocaleDateString()} • {p.method}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600">₹{p.amount}</span>
                  <span className="block text-[10px] text-slate-500 uppercase">{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'ADDRESSES' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Saved Addresses
          </h3>
          {(customer.addresses || []).map((a: any) => (
            <div key={a._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold">{a.label || 'Home'}</span>
              <p className="text-slate-600 mt-0.5">{a.addressLine1}, {a.city} {a.pincode}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
