'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ServiceTier, UnitType, PaymentMethod, Customer, Product } from '@washora/shared';
import { formatCurrency } from '@/lib/utils';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  Phone,
  Tag,
  Zap,
  CheckCircle,
  Printer,
  ShoppingBag,
  Percent,
  Edit3,
  Sparkles,
} from 'lucide-react';

export default function POSPage() {
  const router = useRouter();
  const {
    activeBranch,
    categories,
    products,
    customers,
    cart,
    selectedCustomer,
    setSelectedCustomer,
    selectedTier,
    setSelectedTier,
    discountAmount,
    setDiscountAmount,
    expressSurcharge,
    setExpressSurcharge,
    notes,
    setNotes,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    calculateTotals,
    createOrder,
    getProductPriceForBranch,
    addCustomer,
  } = useApp();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.UPI);
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);

  // Garment notes popup for individual item
  const [activeGarmentItem, setActiveGarmentItem] = useState<{ product: Product; tier: ServiceTier } | null>(null);
  const [garmentColorNote, setGarmentColorNote] = useState<string>('');
  const [garmentBrandNote, setGarmentBrandNote] = useState<string>('');

  // Customer search in modal
  const [custSearch, setCustSearch] = useState('');
  const [isCreatingCust, setIsCreatingCust] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Filter products by category & search query & branch availability
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Check branch availability if defined
      const isAvailableInBranch =
        !p.branchAvailability || p.branchAvailability.includes(activeBranch.id);

      const matchesCategory =
        selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      return isAvailableInBranch && matchesCategory && matchesSearch;
    });
  }, [products, selectedCategoryId, searchQuery, activeBranch.id]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
        c.phone.includes(custSearch)
    );
  }, [customers, custSearch]);

  const { subtotal, discount, tax, total, itemCount } = calculateTotals();

  const handleCreateOrder = (isPaid: boolean = false) => {
    const paid = isPaid ? (paymentAmount || total) : 0;
    const order = createOrder(paid, paymentMethod);
    setCreatedOrderNumber(order.orderNumber);
    setShowPaymentModal(false);
  };

  const handleQuickAdd = (product: Product) => {
    addToCart(product, selectedTier);
  };

  const handleCustomAdd = () => {
    if (!activeGarmentItem) return;
    const note = [garmentColorNote, garmentBrandNote].filter(Boolean).join(' | ');
    addToCart(activeGarmentItem.product, activeGarmentItem.tier, note);
    setActiveGarmentItem(null);
    setGarmentColorNote('');
    setGarmentBrandNote('');
  };

  const handleSaveNewCustomer = () => {
    if (!newCustName.trim() || newCustPhone.length < 10) return;
    const created = addCustomer({
      tenantId: activeBranch.tenantId,
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      address: newCustAddress.trim() || undefined,
    });
    setSelectedCustomer(created);
    setShowCustomerModal(false);
    setIsCreatingCust(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* POS Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400">
              <Zap className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              POS Counter & New Order
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Operational Hub: <span className="font-semibold text-slate-700 dark:text-slate-300">{activeBranch.name}</span> (Tax: {activeBranch.taxRate}%)
          </p>
        </div>

        {/* Global Service Tier Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl">
          {[ServiceTier.REGULAR, ServiceTier.EXPRESS, ServiceTier.SAME_DAY].map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedTier === tier
                  ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tier === ServiceTier.EXPRESS && '⚡ '}
              {tier === ServiceTier.SAME_DAY && '🚀 '}
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: Categories & Visual Garment Grid (8 columns) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Search bar & Category Pills */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search garment name, SKU (e.g. Shirt, Saree, Trouser, Shoe)..."
                className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategoryId('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategoryId === 'all'
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                }`}
              >
                All Garments ({products.length})
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    selectedCategoryId === cat.id
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Garment Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const currentPrice = getProductPriceForBranch(product, selectedTier);

              const inCartCount = cart
                .filter((item) => item.productId === product.id)
                .reduce((sum, item) => sum + item.quantity, 0);

              return (
                <GlassCard
                  key={product.id}
                  onClick={() => handleQuickAdd(product)}
                  variant="interactive"
                  className="p-3.5 flex flex-col justify-between group relative overflow-hidden text-left"
                >
                  {/* Badge if item is in cart */}
                  {inCartCount > 0 && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                      {inCartCount}
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                      {product.icon || '👔'}
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-primary-600 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 truncate">
                        {product.categoryName} · {product.unit}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white font-sans">
                        {formatCurrency(currentPrice)}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">
                        /{product.unit === UnitType.PIECE ? 'pc' : product.unit.toLowerCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveGarmentItem({ product, tier: selectedTier });
                        }}
                        title="Add garment color/tag details"
                        className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary-600 flex items-center justify-center"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <div className="w-6 h-6 rounded-lg bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 group-hover:bg-primary-600 group-hover:text-white flex items-center justify-center transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <EmptyState
              title={`No garments found`}
              description={`No products match "${searchQuery}" in category ${selectedCategoryId} for ${activeBranch.name}.`}
              actionLabel="Add New Product"
              onAction={() => router.push('/products')}
            />
          )}
        </div>

        {/* RIGHT PANEL: Live Order Basket & Customer Selector (4 columns) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <GlassCard className="p-5 sticky top-20 shadow-xl border-slate-200/90 dark:border-slate-800">
            {/* Header: New Order */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Order Summary
                </h2>
                <span className="text-[11px] text-slate-400 font-medium">
                  {itemCount} items in basket
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {/* Customer Profile Picker */}
            <div className="mt-3 p-3 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Customer
                </span>
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="text-[11px] font-semibold text-primary-600 hover:underline"
                >
                  Change / + New
                </button>
              </div>

              {selectedCustomer ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary-600" />
                      {selectedCustomer.name}
                      {selectedCustomer.isVIP && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                          VIP
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {selectedCustomer.phone}
                    </p>
                  </div>
                  {(selectedCustomer.pendingBalance || 0) > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                      Due: {formatCurrency(selectedCustomer.pendingBalance || 0)}
                    </span>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-xs font-semibold text-slate-500 hover:text-primary-600 transition-colors"
                >
                  + Select or Add Customer
                </button>
              )}
            </div>

            {/* Basket Items List */}
            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <ShoppingBag className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                  Select garments from the left panel to begin order
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.productName}
                      </p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span className="font-semibold text-primary-600">{item.tier}</span>
                        <span>· {formatCurrency(item.unitPrice)} each</span>
                      </p>
                      {item.notes && (
                        <p className="text-[10px] text-slate-500 italic mt-0.5 truncate">
                          Note: {item.notes}
                        </p>
                      )}
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-5 h-5 rounded-md bg-white dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-200"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-5 h-5 rounded-md bg-white dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-200"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    <div className="text-right min-w-[50px]">
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-sans">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              {/* Discount Input */}
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Percent className="w-3 h-3 text-slate-400" /> Discount (₹)
                </span>
                <input
                  type="number"
                  min="0"
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-16 text-right px-1.5 py-0.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-semibold outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>GST Tax ({activeBranch.taxRate}%)</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  {formatCurrency(tax)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-baseline justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Grand Total
                  </span>
                  <p className="text-[10px] text-slate-400">Includes all taxes</p>
                </div>
                <span className="text-xl font-extrabold text-primary-600 dark:text-primary-400 font-sans">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* Action Buttons: [Save Unpaid Draft] [Collect & Bill] */}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={cart.length === 0}
                onClick={() => handleCreateOrder(false)}
              >
                Save as Unpaid
              </Button>

              <Button
                variant="primary"
                size="sm"
                disabled={cart.length === 0}
                onClick={() => {
                  setPaymentAmount(total);
                  setShowPaymentModal(true);
                }}
              >
                Collect & Create
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Garment Details / Color Notes Modal */}
      <Modal
        isOpen={!!activeGarmentItem}
        onClose={() => setActiveGarmentItem(null)}
        title="Add Garment Details"
        description={`Customize details for ${activeGarmentItem?.product.name}`}
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setActiveGarmentItem(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCustomAdd}>
              Add to Basket
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Garment Color / Pattern"
            placeholder="e.g. Navy Blue, White Check, Maroon Silk"
            value={garmentColorNote}
            onChange={(e) => setGarmentColorNote(e.target.value)}
            autoFocus
          />
          <Input
            label="Brand / Tag Identifier"
            placeholder="e.g. Raymond, Zara, Van Heusen"
            value={garmentBrandNote}
            onChange={(e) => setGarmentBrandNote(e.target.value)}
          />
        </div>
      </Modal>

      {/* Customer Picker / Creator Modal */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => {
          setShowCustomerModal(false);
          setIsCreatingCust(false);
        }}
        title={isCreatingCust ? 'Register New Customer' : 'Select Customer'}
        description={isCreatingCust ? 'Enter customer contact details' : 'Search customer by name or 10-digit mobile number'}
        maxWidth="md"
      >
        {isCreatingCust ? (
          <div className="space-y-3">
            <Input
              label="Full Name *"
              placeholder="e.g. Rahul Sharma"
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              autoFocus
            />
            <Input
              label="Phone Number (10 digits) *"
              placeholder="e.g. 9876543210"
              value={newCustPhone}
              onChange={(e) => setNewCustPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
            />
            <Input
              label="Address / Flat No"
              placeholder="e.g. Flat 402, Indiranagar"
              value={newCustAddress}
              onChange={(e) => setNewCustAddress(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsCreatingCust(false)}>
                Back to Search
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!newCustName || newCustPhone.length < 10}
                onClick={handleSaveNewCustomer}
              >
                Save & Select Customer
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={custSearch}
                  onChange={(e) => setCustSearch(e.target.value)}
                  placeholder="Search customer name or phone..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                  autoFocus
                />
              </div>
              <Button variant="secondary" size="sm" onClick={() => setIsCreatingCust(true)}>
                + New
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {filteredCustomers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCustomer(c);
                    setShowCustomerModal(false);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedCustomer?.id === c.id
                      ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/40'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {c.name}
                      {c.isVIP && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                          VIP
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">{c.phone}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 font-semibold block">
                      {c.totalOrders || 0} orders
                    </span>
                    {(c.pendingBalance || 0) > 0 && (
                      <span className="text-[10px] text-amber-600 font-bold block mt-0.5">
                        Due: {formatCurrency(c.pendingBalance || 0)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {filteredCustomers.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400">
                  No matching customers. Click "+ New" to add one.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Collect Payment & Create Order"
        description={`Total Payable: ${formatCurrency(total)}`}
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleCreateOrder(paymentAmount >= total)}
            >
              Confirm Order
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[PaymentMethod.UPI, PaymentMethod.CASH, PaymentMethod.CARD].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    paymentMethod === m
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-950 text-primary-600'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Amount Received (₹)
            </label>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 text-base font-bold font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center outline-none"
            />
          </div>

          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs flex justify-between">
            <span>Remaining Due:</span>
            <span className="font-bold font-mono text-amber-600">
              {formatCurrency(Math.max(0, total - paymentAmount))}
            </span>
          </div>
        </div>
      </Modal>

      {/* Success Simulation Modal */}
      <Modal
        isOpen={!!createdOrderNumber}
        onClose={() => setCreatedOrderNumber(null)}
        maxWidth="sm"
      >
        <div className="text-center space-y-4 py-2">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Order Generated!
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Order <span className="font-bold font-mono text-primary-600">{createdOrderNumber}</span> created at {activeBranch.name}.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setCreatedOrderNumber(null)}>
              Close / New Order
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={() => {
                setCreatedOrderNumber(null);
                router.push('/orders');
              }}
            >
              View & Print
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
