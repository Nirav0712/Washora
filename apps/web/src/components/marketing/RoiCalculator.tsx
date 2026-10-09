'use client';

import React, { useState } from 'react';
import { TrendingUp, Calculator, Clock, DollarSign, CheckCircle2, ArrowRight } from 'lucide-react';

export const RoiCalculator: React.FC = () => {
  const [dailyOrders, setDailyOrders] = useState(45);
  const [avgTicketPrice, setAvgTicketPrice] = useState(380);
  const [branches, setBranches] = useState(1);

  const monthlyRevenue = dailyOrders * avgTicketPrice * 30 * branches;
  const hoursSavedWeekly = Math.round(dailyOrders * 0.15 * 6 * branches);
  const lostGarmentSavings = Math.round(monthlyRevenue * 0.04);
  const estimatedProfitBoost = Math.round(monthlyRevenue * 0.18);

  return (
    <div className="bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 rounded-3xl p-8 sm:p-10 border border-blue-800/60 shadow-2xl text-white max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-blue-800/50">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Interactive SaaS Value Calculator
          </span>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight mt-2">
            Calculate Your Laundry Business Growth with Washora
          </h3>
          <p className="text-sm text-blue-200 mt-1 max-w-xl">
            See how much time and money your laundry shop saves every single month by eliminating paper receipts, lost clothes, and manual billing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Sliders (Left) */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex justify-between text-sm font-bold mb-2">
              <span className="text-blue-100">Daily Orders Handled</span>
              <span className="text-cyan-300 font-mono text-base">{dailyOrders} orders/day</span>
            </div>
            <input
              type="range"
              min="10"
              max="300"
              step="5"
              value={dailyOrders}
              onChange={(e) => setDailyOrders(Number(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm font-bold mb-2">
              <span className="text-blue-100">Average Order Value (AOV)</span>
              <span className="text-cyan-300 font-mono text-base">₹{avgTicketPrice}</span>
            </div>
            <input
              type="range"
              min="100"
              max="1500"
              step="20"
              value={avgTicketPrice}
              onChange={(e) => setAvgTicketPrice(Number(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm font-bold mb-2">
              <span className="text-blue-100">Number of Laundry Hubs / Branches</span>
              <span className="text-cyan-300 font-mono text-base">{branches} Location(s)</span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              step="1"
              value={branches}
              onChange={(e) => setBranches(Number(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
            />
          </div>
        </div>

        {/* Projected Value ROI Cards (Right) */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
            <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Estimated Monthly Volume</span>
            <p className="text-2xl font-black text-white font-mono mt-2">
              ₹{monthlyRevenue.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-blue-200 mt-1">Processed securely through Washora</p>
          </div>

          <div className="bg-emerald-500/15 backdrop-blur-md p-5 rounded-2xl border border-emerald-500/30 flex flex-col justify-between">
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Estimated Profit Boost</span>
            <p className="text-2xl font-black text-emerald-400 font-mono mt-2">
              +₹{estimatedProfitBoost.toLocaleString('en-IN')}/mo
            </p>
            <p className="text-[11px] text-emerald-200 mt-1">Via automated upselling & speed</p>
          </div>

          <div className="bg-cyan-500/15 backdrop-blur-md p-5 rounded-2xl border border-cyan-500/30 flex flex-col justify-between">
            <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">Staff Hours Saved</span>
            <p className="text-2xl font-black text-cyan-300 font-mono mt-2">
              {hoursSavedWeekly} hrs/week
            </p>
            <p className="text-[11px] text-cyan-200 mt-1">Faster tagging & auto-dispatch</p>
          </div>

          <div className="bg-purple-500/15 backdrop-blur-md p-5 rounded-2xl border border-purple-500/30 flex flex-col justify-between">
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Zero Lost Garment Claims</span>
            <p className="text-2xl font-black text-purple-300 font-mono mt-2">
              ₹{lostGarmentSavings.toLocaleString('en-IN')}/mo
            </p>
            <p className="text-[11px] text-purple-200 mt-1">Saved from customer dispute payouts</p>
          </div>
        </div>
      </div>
    </div>
  );
};
