'use client';

import React, { useState } from 'react';
import {
  Zap,
  Shirt,
  Sparkles,
  Plus,
  Minus,
  CheckCircle2,
  Printer,
  Smartphone,
  ShieldCheck,
  CreditCard,
  QrCode,
  Tag,
} from 'lucide-react';

interface GarmentDemoItem {
  id: string;
  name: string;
  service: string;
  price: number;
  icon: string;
  tagColor: string;
}

const DEMO_ITEMS: GarmentDemoItem[] = [
  { id: '1', name: 'Cotton Shirt (Steam Press)', service: 'Wash & Steam', price: 60, icon: '👔', tagColor: 'bg-blue-500' },
  { id: '2', name: 'Executive 2-Piece Suit', service: 'Dry Clean', price: 350, icon: '🧥', tagColor: 'bg-indigo-500' },
  { id: '3', name: 'Designer Silk Saree', service: 'Delicate Care', price: 280, icon: '🥻', tagColor: 'bg-rose-500' },
  { id: '4', name: 'Denim Jeans (Stain Treat)', service: 'Heavy Wash', price: 90, icon: '👖', tagColor: 'bg-cyan-500' },
  { id: '5', name: 'King Bed Sheet & Quilt', service: 'Linen Spa', price: 240, icon: '🛏️', tagColor: 'bg-emerald-500' },
];

export const InteractivePosDemo: React.FC = () => {
  const [quantities, setQuantities] = useState<Record<string, number>>({
    '1': 2,
    '2': 1,
    '3': 1,
  });
  const [isExpress, setIsExpress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'CASH'>('UPI');
  const [activeTab, setActiveTab] = useState<'POS' | 'TAGS' | 'WHATSAPP'>('POS');

  const updateQty = (id: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const subtotal = Object.entries(quantities).reduce((acc, [id, qty]) => {
    const item = DEMO_ITEMS.find((i) => i.id === id);
    return acc + (item?.price || 0) * qty;
  }, 0);

  const expressFee = isExpress ? Math.round(subtotal * 0.4) : 0;
  const tax = Math.round((subtotal + expressFee) * 0.05);
  const grandTotal = subtotal + expressFee + tax;
  const totalPieces = Object.values(quantities).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden text-slate-100 max-w-5xl mx-auto">
      {/* Top Header Controls */}
      <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-mono font-bold text-slate-300 ml-2">
            Washora Express POS Live Interactive Counter
          </span>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('POS')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              activeTab === 'POS' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Counter View
          </button>
          <button
            onClick={() => setActiveTab('TAGS')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              activeTab === 'TAGS' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            QR Garment Tags
          </button>
          <button
            onClick={() => setActiveTab('WHATSAPP')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              activeTab === 'WHATSAPP' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            WhatsApp Receipt
          </button>
        </div>
      </div>

      {activeTab === 'POS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* Left Service Menu */}
          <div className="lg:col-span-7 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Garment Catalog</h4>
                <p className="text-xs text-slate-400">Click + / - to build an express laundry order in real-time.</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                1-Click Fast Intake
              </span>
            </div>

            <div className="space-y-2.5">
              {DEMO_ITEMS.map((item) => {
                const qty = quantities[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between ${
                      qty > 0
                        ? 'bg-slate-800/90 border-blue-500/50 shadow-sm'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <p className="font-bold text-sm text-white">{item.name}</p>
                        <p className="text-xs text-slate-400">
                          {item.service} • <span className="text-cyan-400 font-semibold">₹{item.price}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-900 px-2 py-1 rounded-xl border border-slate-700">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-sm"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-sm text-white">{qty}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Express Delivery Toggle */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-amber-400 animate-bounce" />
                <div>
                  <p className="text-xs font-bold text-amber-300">Express 24-Hour Express Turnaround</p>
                  <p className="text-[11px] text-amber-200/70">Priority wash & VIP rack packing (+40% surcharge)</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpress(!isExpress)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  isExpress ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isExpress ? 'ENABLED (24h)' : 'Enable Express'}
              </button>
            </div>
          </div>

          {/* Right Live Order Cart & Settlement */}
          <div className="lg:col-span-5 p-6 bg-slate-950/60 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Order Summary</span>
                <span className="font-mono text-xs font-bold text-blue-400">#ORD-2026-9042</span>
              </div>

              {/* Garments in Cart */}
              <div className="mt-3 space-y-2">
                {totalPieces === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">Add items to view the POS billing calculation.</p>
                ) : (
                  DEMO_ITEMS.map((item) => {
                    const qty = quantities[item.id] || 0;
                    if (qty === 0) return null;
                    return (
                      <div key={item.id} className="flex items-center justify-between text-xs py-1">
                        <span className="text-slate-300">
                          {item.name} <span className="text-slate-500">x{qty}</span>
                        </span>
                        <span className="font-mono font-bold text-white">₹{item.price * qty}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Garment Count</span>
                <span className="font-bold text-slate-200">{totalPieces} items</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono text-slate-200">₹{subtotal}</span>
              </div>
              {isExpress && (
                <div className="flex justify-between text-amber-400">
                  <span>Express Rush Surcharge</span>
                  <span className="font-mono">+₹{expressFee}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>GST (5%)</span>
                <span className="font-mono text-slate-200">₹{tax}</span>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-black text-white">
                <span>Total Payable</span>
                <span className="text-2xl font-black text-cyan-400 font-mono">₹{grandTotal}</span>
              </div>

              {/* Payment Settlement Methods */}
              <div className="pt-3">
                <p className="text-[11px] font-semibold text-slate-400 mb-2">Instant Settlement</p>
                <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                  {(['UPI', 'CARD', 'CASH'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 rounded-xl border transition ${
                        paymentMethod === m
                          ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {m === 'UPI' ? '⚡ QR / UPI' : m === 'CARD' ? '💳 Card' : '💵 Cash'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActiveTab('WHATSAPP')}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Complete Intake & Generate Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Garment Tags Preview */}
      {activeTab === 'TAGS' && (
        <div className="p-8 space-y-6">
          <div className="text-center max-w-lg mx-auto">
            <h4 className="text-lg font-black text-white">Automatic QR Garment Tag Generation</h4>
            <p className="text-xs text-slate-400 mt-1">
              Thermal print heat-resistant QR barcode tags for every garment piece. Prevents garment mix-ups 100%.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {DEMO_ITEMS.slice(0, 3).map((item, idx) => (
              <div key={item.id} className="p-4 rounded-2xl bg-white text-slate-900 border-2 border-dashed border-slate-300 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b pb-2 border-slate-200">
                  <span className="font-extrabold text-xs text-blue-700">WASHORA TAG</span>
                  <span className="font-mono text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                    TAG-{idx + 1}04
                  </span>
                </div>
                <div className="my-3 text-center">
                  <div className="w-16 h-16 mx-auto bg-slate-900 rounded-lg flex items-center justify-center text-white mb-2">
                    <QrCode className="w-12 h-12" />
                  </div>
                  <p className="font-bold text-xs">{item.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono">ORD-9042 • RACK-B2</p>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                  <span>Customer: Anand K.</span>
                  <span className="text-blue-600 font-bold">{item.service}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp Receipt Preview */}
      {activeTab === 'WHATSAPP' && (
        <div className="p-8 max-w-md mx-auto">
          <div className="bg-[#0b141a] p-4 rounded-3xl border border-emerald-900/40 shadow-2xl text-white font-sans text-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-emerald-400 font-bold">
              <Smartphone className="w-4 h-4" />
              <span>WhatsApp Instant Customer Notification</span>
            </div>

            <div className="bg-[#1f2c34] p-4 rounded-2xl space-y-2.5 text-slate-200 border-l-4 border-emerald-500">
              <p className="font-bold text-emerald-400 text-sm">
                🧼 CleanSprint Indiranagar · Order Confirmed!
              </p>
              <p>Hi Anand, thank you for choosing CleanSprint!</p>
              <div className="bg-[#111b21] p-3 rounded-xl space-y-1 font-mono text-[11px]">
                <p>📋 Order ID: <span className="text-white font-bold">#ORD-9042</span></p>
                <p>👕 Total Garments: <span className="text-white font-bold">{totalPieces} items</span></p>
                <p>💰 Amount: <span className="text-emerald-400 font-bold">₹{grandTotal}</span> ({paymentMethod} Paid)</p>
                <p>⏱️ Estimated Ready: <span className="text-cyan-400 font-bold">{isExpress ? 'Tomorrow 11:00 AM' : 'Friday 6:00 PM'}</span></p>
              </div>
              <p className="text-[11px] text-slate-400">
                Track your laundry in real-time using our live GPS portal link below:
              </p>
              <div className="p-2 rounded-lg bg-emerald-900/40 text-emerald-300 font-semibold text-center text-[11px]">
                👉 https://washora.com/track?id=ORD-9042
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
