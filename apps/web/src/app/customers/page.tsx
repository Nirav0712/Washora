'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Customer } from '@washora/shared';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Award,
  Edit2,
  Calendar,
} from 'lucide-react';

export default function CustomersPage() {
  const { customers, orders, addCustomer, updateCustomer, activeBranch } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVIPOnly, setFilterVIPOnly] = useState(false);

  // Customer Create/Edit Modal State
  const [showCustModal, setShowCustModal] = useState(false);
  const [editingCustId, setEditingCustId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [isVIP, setIsVIP] = useState(false);

  // Order history view modal
  const [selectedCustForHistory, setSelectedCustForHistory] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesVIP = !filterVIPOnly || c.isVIP;
    return matchesSearch && matchesVIP;
  });

  const handleOpenAdd = () => {
    setEditingCustId(null);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setIsVIP(false);
    setShowCustModal(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustId(c.id);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email || '');
    setAddress(c.address || '');
    setIsVIP(!!c.isVIP);
    setShowCustModal(true);
  };

  const handleSaveCustomer = () => {
    if (!name.trim() || phone.length < 10) return;

    if (editingCustId) {
      updateCustomer(editingCustId, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        isVIP,
      });
    } else {
      addCustomer({
        tenantId: activeBranch.tenantId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        isVIP,
      });
    }
    setShowCustModal(false);
  };

  const customerOrders = selectedCustForHistory
    ? orders.filter((o) => o.customerId === selectedCustForHistory.id || o.customer?.phone === selectedCustForHistory.phone)
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Customer Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track customer order history, pending dues, VIP badges, and delivery addresses
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
          onClick={handleOpenAdd}
        >
          + Add Customer
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone, email..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:border-primary-500"
          />
        </div>

        <button
          onClick={() => setFilterVIPOnly(!filterVIPOnly)}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
            filterVIPOnly
              ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600'
          }`}
        >
          ★ VIP Members Only
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => (
          <GlassCard key={cust.id} variant="interactive" className="p-5 flex flex-col justify-between group">
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 font-bold text-sm flex items-center justify-center">
                    {cust.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {cust.name}
                      {cust.isVIP && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                          VIP
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {cust.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(cust);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Edit Customer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {(cust.pendingBalance || 0) > 0 ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                      Due: {formatCurrency(cust.pendingBalance || 0)}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Cleared
                    </span>
                  )}
                </div>
              </div>

              {cust.address && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex items-start gap-1.5 line-clamp-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  {cust.address}
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Total Spent</span>
                <p className="font-bold text-slate-900 dark:text-white font-sans">
                  {formatCurrency(cust.totalSpent || 0)}
                </p>
              </div>

              <div className="text-right">
                <button
                  onClick={() => setSelectedCustForHistory(cust)}
                  className="font-semibold text-primary-600 hover:underline flex items-center gap-1"
                >
                  <span>{cust.totalOrders || 0} visits</span> →
                </button>
              </div>
            </div>
          </GlassCard>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              title="No Customers Found"
              description={searchQuery ? `No records matched "${searchQuery}"` : "Register your first customer at the POS or via '+ Add Customer'."}
              actionLabel="+ Add Customer"
              onAction={handleOpenAdd}
            />
          </div>
        )}
      </div>

      {/* Customer Create/Edit Modal */}
      <Modal
        isOpen={showCustModal}
        onClose={() => setShowCustModal(false)}
        title={editingCustId ? 'Edit Customer Profile' : 'Register New Customer'}
        description="Customer account details for order notifications and address delivery"
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowCustModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!name.trim() || phone.length < 10}
              onClick={handleSaveCustomer}
            >
              {editingCustId ? 'Update Customer' : 'Save Customer'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Full Name *"
            placeholder="e.g. Rahul Patel"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <Input
            label="Phone Number (10 digits) *"
            placeholder="e.g. 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
          />
          <Input
            label="Email (Optional)"
            type="email"
            placeholder="e.g. rahul@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Primary Address"
            placeholder="e.g. Flat 402, Sunshine Heights, Indiranagar"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <label className="flex items-center gap-2 pt-1 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isVIP}
              onChange={(e) => setIsVIP(e.target.checked)}
              className="rounded text-primary-600"
            />
            <span>Mark as VIP Account (Priority handling & pickup)</span>
          </label>
        </div>
      </Modal>

      {/* Customer Orders History Modal */}
      <Modal
        isOpen={!!selectedCustForHistory}
        onClose={() => setSelectedCustForHistory(null)}
        title={`${selectedCustForHistory?.name}'s Order History`}
        description={`Total spent: ${formatCurrency(selectedCustForHistory?.totalSpent || 0)}`}
        maxWidth="md"
      >
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {customerOrders.map((o) => (
            <div
              key={o.id}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-mono font-bold text-primary-600">{o.orderNumber}</p>
                <p className="text-[11px] text-slate-400">{formatDate(o.createdAt)}</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                  {o.itemCount} Garments ({o.items.map((i) => i.productName).join(', ')})
                </p>
              </div>
              <div className="text-right">
                <span className="font-bold font-sans text-slate-900 dark:text-white block">
                  {formatCurrency(o.total)}
                </span>
                <span className="text-[10px] font-bold text-emerald-600">
                  {o.paymentStatus}
                </span>
              </div>
            </div>
          ))}

          {customerOrders.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6">
              No orders found for this customer.
            </p>
          )}
        </div>

        {selectedCustForHistory && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">Phone: {selectedCustForHistory.phone}</span>
            <a
              href={`/notifications?search=${selectedCustForHistory.phone}`}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg"
            >
              View WhatsApp History →
            </a>
          </div>
        )}
      </Modal>
    </div>
  );
}
