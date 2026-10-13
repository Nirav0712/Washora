'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { InvoicePreviewModal } from '@/components/ui/InvoicePreviewModal';
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
  FileText,
  Eye,
  Save,
} from 'lucide-react';

export default function SettingsPage() {
  const { tenant, branches, addBranch, updateBranch, activeBranch, showNotification } = useApp();

  const [shopNameInput, setShopNameInput] = useState(tenant.name);
  const [gstinInput, setGstinInput] = useState(tenant.taxRegistrationNumber || '');
  const [invoiceHeader, setInvoiceHeader] = useState('CleanWave Care & Premium Dry Cleaners');

  // Invoice Template Customization State
  const [invoiceTitle, setInvoiceTitle] = useState('TAX INVOICE');
  const [paperSize, setPaperSize] = useState<'A4' | 'THERMAL_80MM' | 'THERMAL_58MM'>('A4');
  const [logoUrl, setLogoUrl] = useState('');
  const [footerText, setFooterText] = useState('Please collect garments within 15 days');
  const [termsText, setTermsText] = useState('Washora is not liable for color bleeding on delicate unlabelled fabrics.');
  const [customFooter, setCustomFooter] = useState('For inquiries or pick-up updates, please reach out to our counter.');
  const [showGstNumber, setShowGstNumber] = useState(true);
  const [showTerms, setShowTerms] = useState(true);
  const [showQrCode, setShowQrCode] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [showStoreContact, setShowStoreContact] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);

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

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('washora_access_token') || localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/settings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => null);
        if (json?.data) {
          const s = json.data;
          const r = s.receiptSettings || {};
          if (r.invoiceTitle) setInvoiceTitle(r.invoiceTitle);
          if (r.paperSize) setPaperSize(r.paperSize);
          if (r.logoUrl) setLogoUrl(r.logoUrl);
          if (r.headerText) setInvoiceHeader(r.headerText);
          if (r.footerText) setFooterText(r.footerText);
          if (r.terms) setTermsText(r.terms);
          if (r.customFooter) setCustomFooter(r.customFooter);
          if (r.showGstNumber !== undefined) setShowGstNumber(r.showGstNumber);
          if (r.showTermsAndConditions !== undefined) setShowTerms(r.showTermsAndConditions);
          if (r.showQrCode !== undefined) setShowQrCode(r.showQrCode);
          if (r.showBarcode !== undefined) setShowBarcode(r.showBarcode);
          if (r.showStoreContact !== undefined) setShowStoreContact(r.showStoreContact);
        }
      } catch (err) {
        // use defaults
      }
    };
    fetchSettings();
  }, []);

  const handleSaveInvoiceSettings = async () => {
    setIsSavingInvoice(true);
    try {
      const token = localStorage.getItem('washora_access_token') || localStorage.getItem('token');
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiptSettings: {
            invoiceTitle,
            paperSize,
            logoUrl: logoUrl.trim(),
            headerText: invoiceHeader.trim(),
            footerText: footerText.trim(),
            terms: termsText.trim(),
            customFooter: customFooter.trim(),
            showGstNumber,
            showTermsAndConditions: showTerms,
            showQrCode,
            showBarcode,
            showStoreContact,
          },
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        showNotification('Invoice & bill template customized and saved!', 'success');
      } else {
        showNotification(data?.message || 'Failed to update invoice template', 'error');
      }
    } catch (err: any) {
      showNotification(err?.message || 'Error updating settings', 'error');
    } finally {
      setIsSavingInvoice(false);
    }
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

      {/* Invoice & Bill Template Customization */}
      <GlassCard className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-600" />
              <span>Customizable Invoice & Bill Printing Template</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure your A4 tax invoices and thermal counter receipts with custom headers, terms, logos, and QR codes
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              leftIcon={<Eye className="w-3.5 h-3.5" />}
              onClick={() => setShowPreviewModal(true)}
            >
              Live Print Preview
            </Button>
            <Button
              variant="primary"
              size="xs"
              leftIcon={<Save className="w-3.5 h-3.5" />}
              disabled={isSavingInvoice}
              onClick={handleSaveInvoiceSettings}
            >
              {isSavingInvoice ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Invoice Title
            </label>
            <select
              value={invoiceTitle}
              onChange={(e) => setInvoiceTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="TAX INVOICE">TAX INVOICE</option>
              <option value="BILL OF SUPPLY">BILL OF SUPPLY</option>
              <option value="RETAIL INVOICE">RETAIL INVOICE</option>
              <option value="ESTIMATE / QUOTATION">ESTIMATE / QUOTATION</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Default Paper Layout
            </label>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="A4">A4 Standard Sheet (Full Details)</option>
              <option value="THERMAL_80MM">80mm Thermal Receipt (POS Roll)</option>
              <option value="THERMAL_58MM">58mm Compact Receipt (Mini Roll)</option>
            </select>
          </div>

          <Input
            label="Shop Brand Logo URL"
            placeholder="https://yourdomain.com/logo.png"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
          />

          <div className="sm:col-span-2">
            <Input
              label="Receipt Tagline / Header"
              value={invoiceHeader}
              onChange={(e) => setInvoiceHeader(e.target.value)}
            />
          </div>

          <Input
            label="Pickup Notice / Collection Limit"
            value={footerText}
            onChange={(e) => setFooterText(e.target.value)}
          />

          <div className="sm:col-span-3">
            <Input
              label="Terms & Conditions (Printed at Bottom)"
              value={termsText}
              onChange={(e) => setTermsText(e.target.value)}
            />
          </div>

          <div className="sm:col-span-3">
            <Input
              label="Custom Footer Notes"
              value={customFooter}
              onChange={(e) => setCustomFooter(e.target.value)}
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-800">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showGstNumber}
              onChange={(e) => setShowGstNumber(e.target.checked)}
              className="rounded text-primary-600"
            />
            <span>Show GSTIN</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showStoreContact}
              onChange={(e) => setShowStoreContact(e.target.checked)}
              className="rounded text-primary-600"
            />
            <span>Show Store Contact</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showQrCode}
              onChange={(e) => setShowQrCode(e.target.checked)}
              className="rounded text-primary-600"
            />
            <span>Print Tracking QR</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showBarcode}
              onChange={(e) => setShowBarcode(e.target.checked)}
              className="rounded text-primary-600"
            />
            <span>Print Order Barcode</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showTerms}
              onChange={(e) => setShowTerms(e.target.checked)}
              className="rounded text-primary-600"
            />
            <span>Print Terms & Conditions</span>
          </label>
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

      {/* Invoice Preview Modal */}
      <InvoicePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        shopName={shopNameInput || tenant.name}
        gstin={gstinInput}
        phone={activeBranch?.phone || '+91 99000 11111'}
        address={activeBranch?.address || 'Main Road, Bengaluru'}
        invoiceTitle={invoiceTitle}
        paperSize={paperSize}
        logoUrl={logoUrl}
        headerText={invoiceHeader}
        footerText={footerText}
        showGstNumber={showGstNumber}
        showTermsAndConditions={showTerms}
        showQrCode={showQrCode}
        showBarcode={showBarcode}
        showStoreContact={showStoreContact}
        terms={termsText}
        customFooter={customFooter}
      />
    </div>
  );
}
