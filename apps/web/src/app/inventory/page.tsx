'use client';

import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  ArrowUpDown,
  History,
  TrendingDown,
  Warehouse,
  Tag,
  DollarSign,
  Package,
} from 'lucide-react';
import { inventoryApi } from '@/lib/api/inventory';
import {
  InventoryItem,
  InventoryCategory,
  StockMovement,
  InventoryUnit,
  StockMovementType,
} from '@washora/shared';
import { useApp } from '@/context/AppContext';

export default function InventoryPage() {
  const { activeBranch } = useApp();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [valuation, setValuation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Add Item State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unit, setUnit] = useState<InventoryUnit>(InventoryUnit.PIECE);
  const [initialStock, setInitialStock] = useState('0');
  const [minimumStock, setMinimumStock] = useState('5');
  const [reorderLevel, setReorderLevel] = useState('10');
  const [unitCost, setUnitCost] = useState('0');

  // Adjust State
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState<StockMovementType>(StockMovementType.CONSUMPTION);
  const [adjustReason, setAdjustReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedCat, lowStockFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemRes, catRes, valRes] = await Promise.all([
        inventoryApi.getItems({
          categoryId: selectedCat || undefined,
          lowStockOnly: lowStockFilter || undefined,
          limit: 100,
        }),
        inventoryApi.getCategories(),
        inventoryApi.getValuation(activeBranch?.id),
      ]);
      setItems(itemRes.data || []);
      setCategories(catRes || []);
      setValuation(valRes || null);
    } catch (err) {
      console.error('Failed to load inventory data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId) return;

    try {
      setSubmitting(true);
      await inventoryApi.createItem({
        branchId: activeBranch.id,
        name,
        categoryId,
        unit,
        initialStock: parseFloat(initialStock) || 0,
        minimumStock: parseFloat(minimumStock) || 0,
        reorderLevel: parseFloat(reorderLevel) || 0,
        unitCost: Math.round((parseFloat(unitCost) || 0) * 100),
      });
      setShowAddModal(false);
      setName('');
      setCategoryId('');
      setInitialStock('0');
      setUnitCost('0');
      await loadData();
    } catch (err) {
      console.error('Failed to create inventory item', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !adjustQty) return;

    try {
      setSubmitting(true);
      const isDeduction =
        adjustType === StockMovementType.CONSUMPTION ||
        adjustType === StockMovementType.DAMAGE ||
        adjustType === StockMovementType.EXPIRY ||
        adjustType === StockMovementType.TRANSFER_OUT;

      const qty = parseFloat(adjustQty);
      const finalQty = isDeduction ? -Math.abs(qty) : Math.abs(qty);

      await inventoryApi.adjustStock({
        inventoryItemId: selectedItem.id || (selectedItem as any)._id,
        type: adjustType,
        quantity: finalQty,
        reason: adjustReason,
      });

      setShowAdjustModal(false);
      setAdjustQty('');
      setAdjustReason('');
      await loadData();
    } catch (err) {
      console.error('Failed to adjust stock', err);
    } finally {
      setSubmitting(false);
    }
  };

  const totalValue = valuation?.totalValuation || 0;
  const lowStockCount = items.filter((i) => i.currentStock <= (i.reorderLevel || 0)).length;

  const filteredItems = items.filter((i) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return i.name?.toLowerCase().includes(q) || i.inventoryCode?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Boxes className="w-7 h-7 text-primary-600 dark:text-primary-400" />
              Inventory & Consumables
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Live stock levels, detergent supplies, weighted average costs & consumption tracking.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Inventory Item
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Stock Valuation</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                ₹{(totalValue / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tracked SKUs</p>
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{items.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Alerts</p>
              <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{lowStockCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search items by name or SKU code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
            />
          </div>
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id || (c as any)._id} value={c.id || (c as any)._id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              lowStockFilter
                ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-300'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Low Stock Only
          </button>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full p-12 text-center text-slate-400">Loading inventory items...</div>
          ) : filteredItems.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Boxes className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-base font-semibold text-slate-700 dark:text-slate-300">No inventory items found</p>
              <p className="text-xs text-slate-400 mt-1">Add items to monitor detergent supplies and automate reorder alerts.</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const id = item.id || (item as any)._id;
              const isLow = (item.currentStock || 0) <= (item.reorderLevel || 0);
              return (
                <div
                  key={id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {item.inventoryCode}
                      </span>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1">{item.name}</h3>
                      <p className="text-xs text-slate-400">{item.category?.name || 'General'}</p>
                    </div>
                    {isLow && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 rounded-full text-[10px] font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Low Stock
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">Current Stock</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {item.currentStock} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">Avg Cost / Unit</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        ₹{(((item.averageCost || 0)) / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-slate-400">
                      Reorder at: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.reorderLevel} {item.unit}</span>
                    </p>
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setShowAdjustModal(true);
                      }}
                      className="px-3 py-1.5 bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-950/50 dark:text-primary-400 font-semibold text-xs rounded-xl transition-colors"
                    >
                      Adjust Stock
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Inventory Item</h3>
              <form onSubmit={handleCreateItem} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Item Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Concentrated Bleach 5L"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Category</label>
                    <select
                      required
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id || (c as any)._id} value={c.id || (c as any)._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Unit</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as InventoryUnit)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                    >
                      <option value="PIECE">Piece (Pcs)</option>
                      <option value="LITER">Liter (L)</option>
                      <option value="KG">Kilogram (Kg)</option>
                      <option value="BOX">Box</option>
                      <option value="PACKET">Packet</option>
                      <option value="ROLL">Roll</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Initial Qty</label>
                    <input
                      type="number"
                      value={initialStock}
                      onChange={(e) => setInitialStock(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Reorder Level</label>
                    <input
                      type="number"
                      value={reorderLevel}
                      onChange={(e) => setReorderLevel(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Unit Cost (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={unitCost}
                      onChange={(e) => setUnitCost(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl"
                  >
                    {submitting ? 'Saving...' : 'Save Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Adjust Stock Modal */}
        {showAdjustModal && selectedItem && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Adjust Stock</h3>
                <p className="text-xs text-slate-500">
                  {selectedItem.name} · Current: {selectedItem.currentStock} {selectedItem.unit}
                </p>
              </div>

              <form onSubmit={handleAdjust} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Action Type</label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as StockMovementType)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  >
                    <option value="CONSUMPTION">Daily Plant Consumption (-)</option>
                    <option value="DAMAGE">Damaged / Leaked (-)</option>
                    <option value="EXPIRY">Expired (-)</option>
                    <option value="MANUAL_ADJUSTMENT">Manual Count Adjustment (+/-)</option>
                    <option value="INITIAL_STOCK">Incoming Stock (+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    placeholder="e.g. 5"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Reason / Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Shift 1 washer load usage"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdjustModal(false)}
                    className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl"
                  >
                    {submitting ? 'Updating...' : 'Update Stock'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
}
