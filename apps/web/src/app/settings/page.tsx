'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Branch } from '@washora/shared';
import {
  Store,
  Building2,
  Printer,
  ShieldCheck,
  CreditCard,
  Plus,
  Edit2,
  CheckCircle,
} from 'lucide-react';

export default function SettingsPage() {
  const { tenant, branches, addBranch, updateBranch, activeBranch, showNotification } = useApp();

  const [shopNameInput, setShopNameInput] = useState(tenant.name);
  const [gstinInput, setGstinInput] = useState(tenant.taxRegistrationNumber || '');
  const [invoiceHeader, setInvoiceHeader] = useState('CleanWave Care & Premium Dry Cleaners');

  // Branch Modal State
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [bName, setBName] = useState('');
  const [bCode, setBCode] = useState('');
  const [bAddress, setBAddress] = useState('');
  const [bCity, setBCity] = useState('Bengaluru');
  const [bPhone, setBPhone] = useState('');
  const [bTax, setBTax] = useState(5);

  const handleOpenAddBranch = () => {
    setEditingBranchId(null);
    setBName('');
    setBCode(`HUB-0${branches.length + 1}`);
    setBAddress('');
    setBCity('Bengaluru');
    setBPhone('');
    setBTax(5);
    setShowBranchModal(true);
  };

  const handleOpenEditBranch = (b: Branch) => {
    setEditingBranchId(b.id);
    setBName(b.name);
    setBCode(b.code);
    setBAddress(b.address || '');
    setBCity(b.city || '');
    setBPhone(b.phone || '');
    setBTax(b.taxRate);
    setShowBranchModal(true);
  };

  const handleSaveBranch = () => {
    if (!bName.trim() || !bCode.trim()) return;
    if (editingBranchId) {
      updateBranch(editingBranchId, {
        name: bName,
        code: bCode,
        address: bAddress,
        city: bCity,
        phone: bPhone,
        taxRate: Number(bTax) || 5,
      });
    } else {
      addBranch({
        tenantId: tenant.id,
        name: bName,
        code: bCode,
        address: bAddress,
        city: bCity,
        phone: bPhone,
        taxRate: Number(bTax) || 5,
        isActive: true,
        isMainHub: false,
      });
    }
    setShowBranchModal(false);
  };

  const handleSaveShopProfile = () => {
    showNotification('Shop Profile updated successfully!', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Business Settings & Configuration
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage shop identity, operational branches, tax rates, garment tag printers, and staff permissions
        </p>
      </div>

      {/* Shop Profile */}
      <GlassCard className="p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Store className="w-4 h-4 text-primary-600" />
          <span>Shop & Business Profile</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <Input
            label="Business Name *"
            value={shopNameInput}
            onChange={(e) => setShopNameInput(e.target.value)}
          />

          <Input
            label="GSTIN / Tax ID"
            value={gstinInput}
            onChange={(e) => setGstinInput(e.target.value)}
          />

          <div className="sm:col-span-2">
            <Input
              label="Receipt Header / Tagline"
              value={invoiceHeader}
              onChange={(e) => setInvoiceHeader(e.target.value)}
            />
          </div>
        </div>

        <div className="pt-2">
          <Button variant="primary" size="sm" onClick={handleSaveShopProfile}>
            Save Brand Details
          </Button>
        </div>
      </GlassCard>

      {/* Multi-Branch Management */}
      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary-600" />
            <span>Configured Branches & Plants ({branches.length})</span>
          </h2>

          <Button
            variant="secondary"
            size="xs"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={handleOpenAddBranch}
          >
            + Add Branch
          </Button>
        </div>

        <div className="space-y-2.5">
          {branches.map((b) => (
            <div
              key={b.id}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-bold text-slate-900 dark:text-white">{b.name}</span>
                  {b.isMainHub && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 font-bold">
                      Main Hub
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Code: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{b.code}</span> · GST: {b.taxRate}% · Phone: {b.phone}
                </p>
                <p className="text-[11px] text-slate-500 truncate max-w-md">{b.address}, {b.city}</p>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="xs"
                  leftIcon={<Edit2 className="w-3 h-3" />}
                  onClick={() => handleOpenEditBranch(b)}
                >
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Thermal Garment Tag Printer Settings */}
      <GlassCard className="p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Printer className="w-4 h-4 text-primary-600" />
          <span>Thermal Tag Printer Settings ({activeBranch.name})</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <Input
            label="Tag Width (mm)"
            type="number"
            defaultValue={50}
          />
          <Input
            label="Tag Height (mm)"
            type="number"
            defaultValue={30}
          />
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer pb-2">
              <input type="checkbox" defaultChecked className="rounded text-primary-600" />
              <span>Auto-print tags upon POS order creation</span>
            </label>
          </div>
        </div>
      </GlassCard>

      {/* Staff & Roles Matrix */}
      <GlassCard className="p-6 space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary-600" />
          <span>Staff Roles & RBAC Matrix</span>
        </h2>
        <p className="text-xs text-slate-400">
          Role permissions are enforced across POS billing, financial reports, and QC stations.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs">
          {[
            { role: 'SHOP_OWNER', desc: 'Full System & Tenant Access' },
            { role: 'BRANCH_MANAGER', desc: 'Branch Orders, Billing & Staff' },
            { role: 'CASHIER', desc: 'POS Counter & Customer Dues' },
            { role: 'OPERATOR', desc: 'Plant Wash Cycle & Garment Prep' },
            { role: 'QC_INSPECTOR', desc: 'Quality Check & Finish Packing' },
            { role: 'DELIVERY_AGENT', desc: 'Doorstep Navigation & Delivery' },
          ].map((r) => (
            <div
              key={r.role}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60"
            >
              <p className="font-bold text-primary-600 dark:text-primary-400 font-mono text-[11px]">{r.role}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{r.desc}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* SaaS Subscription & Plan */}
      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary-600" />
            <span>SaaS Plan & Subscription Quotas</span>
          </h2>

          <Link href="/settings/subscription">
            <Button variant="outline" size="sm">
              Manage Subscription →
            </Button>
          </Link>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          View your current subscription plan tier, monthly usage quotas (branches, staff, customers, orders), enabled features, and platform invoice receipts.
        </p>
      </GlassCard>

      {/* Add / Edit Branch Modal */}
      <Modal
        isOpen={showBranchModal}
        onClose={() => setShowBranchModal(false)}
        title={editingBranchId ? 'Edit Branch Details' : 'Add New Branch / Plant'}
        description="Configure branch location, contact number, and tax rate"
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowBranchModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveBranch}>
              {editingBranchId ? 'Update Branch' : 'Create Branch'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Branch Name *"
            placeholder="e.g. Koramangala Hub"
            value={bName}
            onChange={(e) => setBName(e.target.value)}
            autoFocus
          />
          <Input
            label="Branch Code *"
            placeholder="e.g. KOR-02"
            value={bCode}
            onChange={(e) => setBCode(e.target.value)}
          />
          <Input
            label="Phone Number"
            placeholder="e.g. 080-25251122"
            value={bPhone}
            onChange={(e) => setBPhone(e.target.value)}
          />
          <Input
            label="Address"
            placeholder="e.g. 80ft Road, 4th Block"
            value={bAddress}
            onChange={(e) => setBAddress(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="City"
              value={bCity}
              onChange={(e) => setBCity(e.target.value)}
            />
            <Input
              label="GST Tax Rate (%)"
              type="number"
              value={bTax}
              onChange={(e) => setBTax(Number(e.target.value) || 5)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
