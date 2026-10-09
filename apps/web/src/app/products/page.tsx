'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { UnitType, Product, Category } from '@washora/shared';
import { formatCurrency } from '@/lib/utils';
import {
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  Check,
  FolderPlus,
  Store,
  Layers,
} from 'lucide-react';

export default function ProductsPage() {
  const {
    activeBranch,
    branches,
    categories,
    products,
    addCategory,
    updateCategory,
    deleteCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductPriceForBranch,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  // Category Modal State
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('👔');
  const [catDesc, setCatDesc] = useState('');

  // Delete Confirm States
  const [catToDelete, setCatToDelete] = useState<Category | null>(null);
  const [prodToDelete, setProdToDelete] = useState<Product | null>(null);

  // Progressive 4-Step Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(selectedCategory || categories[0]?.id || '');
  const [unit, setUnit] = useState<UnitType>(UnitType.PIECE);
  const [regularPrice, setRegularPrice] = useState<number>(60);
  const [expressPrice, setExpressPrice] = useState<number>(90);
  const [sameDayPrice, setSameDayPrice] = useState<number>(120);

  // Advanced settings state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sku, setSku] = useState('');
  const [taxPercent, setTaxPercent] = useState(5);
  const [processingTimeHours, setProcessingTimeHours] = useState(48);
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>(branches.map((b) => b.id));

  const currentCatObj = categories.find((c) => c.id === selectedCategory) || categories[0];
  const categoryProducts = products.filter(
    (p) =>
      (selectedCategory ? p.categoryId === selectedCategory : true) &&
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const handleOpenAddProduct = () => {
    setEditingProdId(null);
    setName('');
    setCategoryId(selectedCategory || categories[0]?.id || '');
    setUnit(UnitType.PIECE);
    setRegularPrice(60);
    setExpressPrice(90);
    setSameDayPrice(120);
    setSku('');
    setDescription('');
    setInstructions('');
    setSelectedBranchIds(branches.map((b) => b.id));
    setStep(1);
    setShowAdvanced(false);
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProdId(prod.id);
    setName(prod.name);
    setCategoryId(prod.categoryId);
    setUnit(prod.unit);
    setRegularPrice(prod.prices.regular);
    setExpressPrice(prod.prices.express);
    setSameDayPrice(prod.prices.sameDay);
    setSku(prod.sku || '');
    setTaxPercent(prod.taxRate ?? prod.taxPercent ?? 5);
    setProcessingTimeHours(prod.processingTimeHours || 48);
    setDescription(prod.description || '');
    setInstructions(prod.instructions || '');
    setSelectedBranchIds(prod.branchAvailability || branches.map((b) => b.id));
    setStep(1);
    setShowAdvanced(true);
    setShowProductModal(true);
  };

  const handleSaveProduct = () => {
    if (!name.trim()) return;
    const catName = categories.find((c) => c.id === categoryId)?.name || 'General Care';

    if (editingProdId) {
      updateProduct(editingProdId, {
        name,
        categoryId,
        categoryName: catName,
        unit,
        prices: {
          regular: Number(regularPrice) || 0,
          express: Number(expressPrice) || 0,
          sameDay: Number(sameDayPrice) || 0,
        },
        sku,
        taxPercent,
        processingTimeHours,
        description,
        instructions,
        branchAvailability: selectedBranchIds,
      });
    } else {
      addProduct({
        tenantId: activeBranch.tenantId,
        categoryId,
        categoryName: catName,
        name,
        sku: sku || `SKU-${name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`,
        unit,
        prices: {
          regular: Number(regularPrice) || 0,
          express: Number(expressPrice) || 0,
          sameDay: Number(sameDayPrice) || 0,
        },
        taxPercent,
        processingTimeHours,
        description,
        instructions,
        icon: currentCatObj?.icon || '👔',
        isActive: true,
        branchAvailability: selectedBranchIds,
      });
    }

    setShowProductModal(false);
  };

  const handleSaveCategory = () => {
    if (!catName.trim()) return;
    if (editingCatId) {
      updateCategory(editingCatId, {
        name: catName,
        icon: catIcon,
        description: catDesc,
      });
    } else {
      addCategory({
        tenantId: activeBranch.tenantId,
        name: catName,
        icon: catIcon,
        slug: catName.toLowerCase().replace(/\s+/g, '-'),
        description: catDesc,
        displayOrder: categories.length + 1,
        isActive: true,
      });
    }
    setShowCatModal(false);
    setEditingCatId(null);
    setCatName('');
    setCatDesc('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Products & Service Catalog
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dynamic service categories, branch rate cards, and multi-tier pricing SLA
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<FolderPlus className="w-4 h-4" />}
            onClick={() => {
              setEditingCatId(null);
              setCatName('');
              setCatDesc('');
              setCatIcon('🧺');
              setShowCatModal(true);
            }}
          >
            + Add Category
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            onClick={handleOpenAddProduct}
          >
            + Add Product
          </Button>
        </div>
      </div>

      {/* Category Horizontal Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Categories ({categories.length})
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = products.filter((p) => p.categoryId === cat.id).length;

            return (
              <GlassCard
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                variant={isSelected ? 'accent' : 'interactive'}
                className={`p-3.5 text-center cursor-pointer relative group transition-all ${
                  isSelected ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-md' : ''
                }`}
              >
                <div className="text-2xl mb-1.5">{cat.icon}</div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {count} Products
                </p>

                {/* Edit category button on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCatId(cat.id);
                    setCatName(cat.name);
                    setCatIcon(cat.icon || 'Shirt');
                    setCatDesc(cat.description || '');
                    setShowCatModal(true);
                  }}
                  className="absolute top-1.5 right-1.5 p-1 rounded-md bg-white dark:bg-slate-800 text-slate-400 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Edit Category"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Category Drilldown Table */}
      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{currentCatObj?.icon || '📦'}</span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {currentCatObj?.name || 'All Garments'}
              </h2>
              <p className="text-xs text-slate-400">
                {currentCatObj?.description || 'Catalog of cleanable products and garments'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search within category..."
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
              />
            </div>
            {currentCatObj && (
              <Button
                variant="ghost"
                size="xs"
                className="text-rose-500 hover:bg-rose-50"
                onClick={() => setCatToDelete(currentCatObj)}
              >
                Delete Category
              </Button>
            )}
          </div>
        </div>

        {/* Product Table */}
        <div className="mt-4 overflow-x-auto">
          {categoryProducts.length === 0 ? (
            <EmptyState
              title="No Products In Category"
              description="Add your first garment product to start billing under this category."
              actionLabel="+ Add Product"
              onAction={handleOpenAddProduct}
            />
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3">Product Name</th>
                  <th className="pb-3">Unit</th>
                  <th className="pb-3">Regular Price ({activeBranch.name})</th>
                  <th className="pb-3">Express Price</th>
                  <th className="pb-3">Same Day</th>
                  <th className="pb-3">Tax</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {categoryProducts.map((prod) => {
                  const regPrice = getProductPriceForBranch(prod, 'Regular' as any);
                  const expPrice = getProductPriceForBranch(prod, 'Express' as any);
                  const samePrice = getProductPriceForBranch(prod, 'Same Day' as any);

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{prod.icon || '👔'}</span>
                          <span>{prod.name}</span>
                        </div>
                        {prod.sku && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {prod.sku}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 font-medium text-slate-600 dark:text-slate-300">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px]">
                          {prod.unit}
                        </span>
                      </td>
                      <td className="py-3.5 font-bold font-sans text-slate-900 dark:text-white">
                        {formatCurrency(regPrice)}
                      </td>
                      <td className="py-3.5 font-semibold font-sans text-primary-600 dark:text-primary-400">
                        {formatCurrency(expPrice)}
                      </td>
                      <td className="py-3.5 font-semibold font-sans text-secondary-600 dark:text-secondary-400">
                        {formatCurrency(samePrice)}
                      </td>
                      <td className="py-3.5 text-slate-500">{prod.taxPercent}% GST</td>
                      <td className="py-3.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditProduct(prod)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setProdToDelete(prod)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>

      {/* Category Create/Edit Modal */}
      <Modal
        isOpen={showCatModal}
        onClose={() => setShowCatModal(false)}
        title={editingCatId ? 'Edit Category' : 'Add New Category'}
        description="Categorize your products for easy POS counter lookup"
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowCatModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveCategory}>
              Save Category
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Category Name *"
            placeholder="e.g. Leather Care, Heavy Curtains"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            autoFocus
          />
          <Input
            label="Icon Emoji"
            placeholder="e.g. 👔, 🧺, 👟, ✨, 🛏️"
            value={catIcon}
            onChange={(e) => setCatIcon(e.target.value)}
          />
          <Input
            label="Description"
            placeholder="e.g. Solvent dry cleaning for delicate garments"
            value={catDesc}
            onChange={(e) => setCatDesc(e.target.value)}
          />
        </div>
      </Modal>

      {/* 4-Step Progressive Product Modal */}
      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={editingProdId ? 'Edit Product Rate' : 'Add New Product & Rate'}
        description="4-step progressive product configuration"
        maxWidth="lg"
      >
        {/* Step Indicators */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800 px-2">
          {[
            { n: 1, label: 'Name' },
            { n: 2, label: 'Category' },
            { n: 3, label: 'Unit' },
            { n: 4, label: 'Pricing & SLA' },
          ].map((s) => (
            <div key={s.n} className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  step === s.n
                    ? 'bg-primary-600 text-white shadow-sm'
                    : step > s.n
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                {step > s.n ? '✓' : s.n}
              </div>
              <span
                className={`text-xs font-semibold ${
                  step === s.n ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Form Body */}
        <div className="space-y-4 min-h-[220px]">
          {step === 1 && (
            <div className="space-y-3">
              <Input
                label="Product / Garment Name *"
                placeholder="e.g. Silk Saree, Winter Jacket, Linen Trouser"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Give a crisp, recognizable name so counter cashiers can easily search it.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Select Service Category
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                      categoryId === c.id
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-950 text-primary-600'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-lg">{c.icon}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Billing Unit Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[UnitType.PIECE, UnitType.KG, UnitType.PAIR, UnitType.METER].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={`py-3 rounded-xl border text-center text-xs font-bold transition-all ${
                      unit === u
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-950 text-primary-600 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Multi-Tier Rates (₹)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Regular Rate
                  </span>
                  <input
                    type="number"
                    value={regularPrice}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setRegularPrice(val);
                      setExpressPrice(Math.round(val * 1.5));
                      setSameDayPrice(Math.round(val * 2.0));
                    }}
                    className="w-full text-base font-bold font-mono bg-transparent outline-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-primary-600 block mb-1">
                    Express Rate (⚡)
                  </span>
                  <input
                    type="number"
                    value={expressPrice}
                    onChange={(e) => setExpressPrice(Number(e.target.value) || 0)}
                    className="w-full text-base font-bold font-mono bg-transparent outline-none text-primary-600"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-secondary-600 block mb-1">
                    Same Day (🚀)
                  </span>
                  <input
                    type="number"
                    value={sameDayPrice}
                    onChange={(e) => setSameDayPrice(Number(e.target.value) || 0)}
                    className="w-full text-base font-bold font-mono bg-transparent outline-none text-secondary-600"
                  />
                </div>
              </div>

              {/* Expandable Advanced Settings */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs font-semibold text-primary-600 flex items-center gap-1"
                >
                  {showAdvanced ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <span>Advanced Settings (Branch Availability, SKU, Care Notes)</span>
                </button>

                {showAdvanced && (
                  <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-3 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-500 font-semibold block mb-1">
                        Operational Branch Availability
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {branches.map((b) => {
                          const isChecked = selectedBranchIds.includes(b.id);
                          return (
                            <label
                              key={b.id}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                                isChecked
                                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-500'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedBranchIds([...selectedBranchIds, b.id]);
                                  } else {
                                    setSelectedBranchIds(selectedBranchIds.filter((id) => id !== b.id));
                                  }
                                }}
                                className="rounded text-primary-600"
                              />
                              <span>{b.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Custom SKU"
                        placeholder="e.g. DC-SILK-01"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                      />
                      <Input
                        label="Tax Rate (%)"
                        type="number"
                        value={taxPercent}
                        onChange={(e) => setTaxPercent(Number(e.target.value) || 0)}
                      />
                    </div>

                    <Input
                      label="Care Instructions"
                      placeholder="e.g. Roll press only, do not crease"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Nav Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
          {step > 1 ? (
            <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Button
              variant="primary"
              size="sm"
              disabled={step === 1 && !name.trim()}
              onClick={() => setStep(step + 1)}
            >
              Next Step →
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={handleSaveProduct}>
              {editingProdId ? 'Update Product' : 'Save Product'}
            </Button>
          )}
        </div>
      </Modal>

      {/* Delete Category Dialog */}
      <ConfirmDialog
        isOpen={!!catToDelete}
        onClose={() => setCatToDelete(null)}
        onConfirm={() => {
          if (catToDelete) deleteCategory(catToDelete.id);
          setCatToDelete(null);
        }}
        title="Delete Category?"
        description={`Are you sure you want to delete category "${catToDelete?.name}"? All products under this category will also be removed.`}
        confirmLabel="Delete Category"
        variant="danger"
      />

      {/* Delete Product Dialog */}
      <ConfirmDialog
        isOpen={!!prodToDelete}
        onClose={() => setProdToDelete(null)}
        onConfirm={() => {
          if (prodToDelete) deleteProduct(prodToDelete.id);
          setProdToDelete(null);
        }}
        title="Delete Product?"
        description={`Are you sure you want to remove "${prodToDelete?.name}" from your catalog?`}
        confirmLabel="Delete Product"
        variant="danger"
      />
    </div>
  );
}
