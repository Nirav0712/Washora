'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  Package,
  FileText,
  DollarSign,
  AlertCircle,
  Truck,
} from 'lucide-react';
import { purchasesApi } from '@/lib/api/purchases';
import { suppliersApi } from '@/lib/api/suppliers';
import { inventoryApi } from '@/lib/api/inventory';
import {
  Purchase,
  Supplier,
  InventoryItem,
  PurchaseStatus,
  PurchasePaymentStatus,
  ExpensePaymentMethod,
} from '@washora/shared';
import { useApp } from '@/context/AppContext';

export default function PurchasesPage() {
  const { activeBranch } = useApp();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Purchase Form
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState<Array<{ inventoryItemId: string; quantity: number; unitCost: number; taxRate: number }>>([
    { inventoryItemId: '', quantity: 1, unitCost: 0, taxRate: 0 },
  ]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [purRes, supRes, invRes] = await Promise.all([
        purchasesApi.getPurchases({ limit: 50 }),
        suppliersApi.getSuppliers({ limit: 100 }),
        inventoryApi.getItems({ limit: 100 }),
      ]);
      setPurchases(purRes.data || []);
      setSuppliers(supRes.data || []);
      setInventoryItems(invRes.data || []);
    } catch (err) {
      console.error('Failed to load purchases data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItemRow = () => {
    setItems([...items, { inventoryItemId: '', quantity: 1, unitCost: 0, taxRate: 0 }]);
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = val;

    // Auto-fill cost if item selected
    if (field === 'inventoryItemId') {
      const selected = inventoryItems.find((i) => (i.id || (i as any)._id) === val);
      if (selected && selected.averageCost) {
        updated[index].unitCost = selected.averageCost / 100;
      }
    }

    setItems(updated);
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || items.length === 0 || !items[0].inventoryItemId) return;

    try {
      setSubmitting(true);
      await purchasesApi.createPurchase({
        branchId: activeBranch.id,
        supplierId,
        items: items
          .filter((i) => !!i.inventoryItemId)
          .map((i) => ({
            inventoryItemId: i.inventoryItemId,
            quantity: Number(i.quantity),
            unitCost: Math.round(Number(i.unitCost) * 100),
            taxRate: Number(i.taxRate) || 0,
          })),
        notes,
      });
      setShowAddModal(false);
      setSupplierId('');
      setItems([{ inventoryItemId: '', quantity: 1, unitCost: 0, taxRate: 0 }]);
      setNotes('');
      await loadData();
    } catch (err) {
      console.error('Failed to create purchase order', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceive = async (id: string) => {
    try {
      await purchasesApi.receivePurchase(id);
      await loadData();
    } catch (err) {
      console.error('Failed to receive purchase', err);
    }
  };

  const filteredPurchases = purchases.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.purchaseNumber?.toLowerCase().includes(q) ||
      p.supplier?.businessName?.toLowerCase().includes(q) ||
      p.notes?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-7 h-7 text-primary-600 dark:text-primary-400" />
              Purchase Orders
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Procurement workflow, purchase receipts, inventory stock in-flow & vendor billing.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            New Purchase Order
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by PO number or supplier name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
          />
        </div>

        {/* PO Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading purchase orders...</div>
          ) : filteredPurchases.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-base font-semibold text-slate-700 dark:text-slate-300">No purchase orders created</p>
              <p className="text-xs text-slate-400 mt-1">Create a PO to restock inventory items and manage supplier dues.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase">
                    <th className="py-3 px-4">PO Number</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Grand Total</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredPurchases.map((po) => {
                    const id = po.id || (po as any)._id;
                    return (
                      <tr key={id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-900 dark:text-slate-200">
                          {po.purchaseNumber}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                          {po.supplier?.businessName || 'Supplier'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{po.purchaseDate}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          ₹{((po.grandTotal || 0) / 100).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              po.paymentStatus === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : po.paymentStatus === 'PARTIALLY_PAID' || po.paymentStatus === 'PARTIAL'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}
                          >
                            {po.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                              po.status === 'RECEIVED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : po.status === 'CANCELLED'
                                ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                          >
                            {po.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleReceive(id)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400"
                            >
                              Receive Goods
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* New Purchase Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Purchase Order</h3>
              <form onSubmit={handleCreatePurchase} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Supplier</label>
                  <select
                    required
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id || (s as any)._id} value={s.id || (s as any)._id}>
                        {s.businessName} ({s.supplierCode})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Items</label>
                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="text-xs text-primary-600 font-semibold hover:underline"
                    >
                      + Add Item Row
                    </button>
                  </div>

                  {items.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <select
                          required
                          value={row.inventoryItemId}
                          onChange={(e) => handleItemChange(idx, 'inventoryItemId', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        >
                          <option value="">Select Item</option>
                          {inventoryItems.map((item) => (
                            <option key={item.id || (item as any)._id} value={item.id || (item as any)._id}>
                              {item.name} ({item.unit})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          required
                          placeholder="Qty"
                          value={row.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          placeholder="Cost (₹)"
                          value={row.unitCost}
                          onChange={(e) => handleItemChange(idx, 'unitCost', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Delivery instructions or purchase notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
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
                    {submitting ? 'Creating...' : 'Create Purchase Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
}
