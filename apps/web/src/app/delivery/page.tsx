'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Phone,
  MapPin,
  Navigation,
  CheckCircle2,
  XCircle,
  Clock,
  Banknote,
  FileCheck,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Calendar,
  Layers,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { pickupsApi } from '@/lib/api/pickups';
import { deliveriesApi } from '@/lib/api/deliveries';
import { logisticsApi } from '@/lib/api/logistics';
import {
  PickupRequest,
  DeliveryRequest,
  PickupStatus,
  DeliveryStatus,
  DeliveryAgentSummary,
  PaymentMethod,
} from '@washora/shared';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function DeliveryAgentMobilePage() {
  const { tenant, activeBranch } = useApp();
  const [activeTab, setActiveTab] = useState<'ALL' | 'PICKUPS' | 'DELIVERIES'>('ALL');
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRequest[]>([]);
  const [agents, setAgents] = useState<DeliveryAgentSummary[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Quick Action State
  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRequest | null>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMethod, setCollectMethod] = useState<PaymentMethod>(PaymentMethod.CASH);

  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');

  const branchId = activeBranch.id || (activeBranch as any)._id;

  const loadData = async () => {
    try {
      setLoading(true);
      const [puRes, delRes, agRes] = await Promise.all([
        pickupsApi.getAll({
          branchId,
          agentId: selectedAgentId || undefined,
        }),
        deliveriesApi.getAll({
          branchId,
          agentId: selectedAgentId || undefined,
        }),
        logisticsApi.getAgents({ branchId }),
      ]);

      if (puRes?.data) setPickups(puRes.data);
      if (delRes?.data) setDeliveries(delRes.data);
      if (agRes?.data) setAgents(agRes.data);
    } catch (err) {
      console.error('Failed to load agent jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [branchId, selectedAgentId]);

  // Handler for pickups
  const handlePickupAction = async (pickupId: string, action: 'start' | 'arrive' | 'complete' | 'fail') => {
    try {
      if (action === 'start') await pickupsApi.start(pickupId);
      if (action === 'arrive') await pickupsApi.arrive(pickupId);
      if (action === 'complete') await pickupsApi.complete(pickupId);
      if (action === 'fail') {
        const reason = prompt('Enter failure reason (CUSTOMER_NOT_AVAILABLE / PHONE_UNREACHABLE):', 'CUSTOMER_NOT_AVAILABLE');
        if (!reason) return;
        await pickupsApi.fail(pickupId, { reason: reason as any, note: 'Failed via mobile agent interface' });
      }
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to perform ${action}`);
    }
  };

  // Handler for deliveries
  const handleDeliveryAction = async (deliveryId: string, action: 'start' | 'arrive' | 'complete' | 'fail') => {
    try {
      if (action === 'start') await deliveriesApi.start(deliveryId);
      if (action === 'arrive') await deliveriesApi.arrive(deliveryId);
      if (action === 'complete') await deliveriesApi.complete(deliveryId);
      if (action === 'fail') {
        const reason = prompt('Enter failure reason (CUSTOMER_NOT_AVAILABLE / CUSTOMER_REFUSED):', 'CUSTOMER_NOT_AVAILABLE');
        if (!reason) return;
        await deliveriesApi.fail(deliveryId, { reason: reason as any, note: 'Failed via mobile agent interface' });
      }
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to perform ${action}`);
    }
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery || collectAmount <= 0) return;
    const targetId = (selectedDelivery.id || selectedDelivery._id)!;
    try {
      await deliveriesApi.recordCollection(targetId, {
        amount: collectAmount,
        paymentMethod: collectMethod,
        notes: 'Doorstep collection via mobile agent dispatch',
      });
      setCollectModalOpen(false);
      setSelectedDelivery(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Collection failed');
    }
  };

  const handleSaveProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery || !recipientName) return;
    const targetId = (selectedDelivery.id || selectedDelivery._id)!;
    try {
      await deliveriesApi.saveProof(targetId, {
        recipientName,
        recipientPhone,
        deliveryNote,
      });
      setProofModalOpen(false);
      setSelectedDelivery(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save proof');
    }
  };

  // Metrics
  const totalCashCollected = deliveries.reduce((acc, d) => acc + (d.collectionAmount || 0), 0);
  const completedJobs =
    pickups.filter((p) => p.status === PickupStatus.PICKED_UP).length +
    deliveries.filter((d) => d.status === DeliveryStatus.DELIVERED).length;
  const pendingJobs =
    pickups.filter((p) => p.status !== PickupStatus.PICKED_UP && p.status !== PickupStatus.CANCELLED).length +
    deliveries.filter((d) => d.status !== DeliveryStatus.DELIVERED && d.status !== DeliveryStatus.CANCELLED).length;

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-20 pt-2 px-3 sm:px-4">
      {/* Mobile Top App Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm sticky top-2 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-secondary-500 text-white flex items-center justify-center font-bold shadow-md shadow-primary-500/20">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              Agent Dispatch
            </h1>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {activeBranch.name}
            </p>
          </div>
        </div>
        <button
          onClick={loadData}
          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Agent Selector */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 shrink-0">Driver:</span>
        <select
          value={selectedAgentId}
          onChange={(e) => setSelectedAgentId(e.target.value)}
          className="w-full text-xs font-bold py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
        >
          <option value="">All Branch Drivers (Team View)</option>
          {agents.map((ag) => (
            <option key={ag.agentId} value={ag.agentId}>
              {ag.name} ({ag.phone})
            </option>
          ))}
        </select>
      </div>

      {/* Driver Daily Workload Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-3 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 text-center">
          <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            Collected
          </p>
          <p className="text-base font-extrabold text-emerald-900 dark:text-emerald-100 mt-0.5">
            ₹{totalCashCollected.toFixed(0)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-primary-500/10 to-primary-600/5 p-3 rounded-2xl border border-primary-200/60 dark:border-primary-800/40 text-center">
          <p className="text-[10px] font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider">
            Completed
          </p>
          <p className="text-base font-extrabold text-primary-900 dark:text-primary-100 mt-0.5">
            {completedJobs}
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-3 rounded-2xl border border-amber-200/60 dark:border-amber-800/40 text-center">
          <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            Pending
          </p>
          <p className="text-base font-extrabold text-amber-900 dark:text-amber-100 mt-0.5">
            {pendingJobs}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl gap-1">
        <button
          onClick={() => setActiveTab('ALL')}
          className={cn(
            'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all',
            activeTab === 'ALL'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          )}
        >
          All ({pickups.length + deliveries.length})
        </button>
        <button
          onClick={() => setActiveTab('PICKUPS')}
          className={cn(
            'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all',
            activeTab === 'PICKUPS'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          )}
        >
          Pickups ({pickups.length})
        </button>
        <button
          onClick={() => setActiveTab('DELIVERIES')}
          className={cn(
            'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all',
            activeTab === 'DELIVERIES'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          )}
        >
          Deliveries ({deliveries.length})
        </button>
      </div>

      {/* Job Cards Feed */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-500" />
            Loading assigned tasks...
          </div>
        ) : (
          <>
            {/* PICKUPS FEED */}
            {(activeTab === 'ALL' || activeTab === 'PICKUPS') &&
              pickups.map((pu) => (
                <div
                  key={pu.id || (pu as any)._id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                      PICKUP · {pu.pickupNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {pu.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {pu.pickupAddress?.name || 'Customer'}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-start gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span>
                        {pu.pickupAddress?.addressLine1}, {pu.pickupAddress?.area} ({pu.pickupAddress?.pincode})
                      </span>
                    </p>
                  </div>

                  {/* Slot & Time */}
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {pu.scheduledTimeFrom} - {pu.scheduledTimeTo}
                    </span>
                    {pu.specialInstructions && (
                      <span className="truncate italic">Note: {pu.specialInstructions}</span>
                    )}
                  </div>

                  {/* Quick Action Touch Bar */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={`tel:${pu.pickupAddress?.phone}`}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs active:scale-95 transition-transform"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      Call Customer
                    </a>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(
                        `${pu.pickupAddress?.addressLine1 || ''} ${pu.pickupAddress?.area || ''} ${
                          pu.pickupAddress?.city || ''
                        }`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs active:scale-95 transition-transform"
                    >
                      <Navigation className="w-3.5 h-3.5 text-primary-600" />
                      Map / Navigate
                    </a>
                  </div>

                  {/* Status Step Actions */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    {(pu.status === PickupStatus.REQUESTED ||
                      pu.status === PickupStatus.SCHEDULED ||
                      pu.status === PickupStatus.ASSIGNED) && (
                      <button
                        onClick={() => handlePickupAction((pu.id || pu._id)!, 'start')}
                        className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-xs shadow-md shadow-primary-500/20 active:scale-98 transition-transform"
                      >
                        Start Pickup Trip
                      </button>
                    )}

                    {pu.status === PickupStatus.OUT_FOR_PICKUP && (
                      <>
                        <button
                          onClick={() => handlePickupAction((pu.id || pu._id)!, 'arrive')}
                          className="flex-1 py-2.5 rounded-xl bg-cyan-600 text-white font-bold text-xs active:scale-98"
                        >
                          Mark Arrived
                        </button>
                        <button
                          onClick={() => handlePickupAction((pu.id || pu._id)!, 'fail')}
                          className="px-3 py-2.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 text-xs font-bold"
                        >
                          Fail
                        </button>
                      </>
                    )}

                    {pu.status === PickupStatus.ARRIVED && (
                      <>
                        <button
                          onClick={() => handlePickupAction((pu.id || pu._id)!, 'complete')}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-98"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Confirm Garment Pickup
                        </button>
                        <button
                          onClick={() => handlePickupAction((pu.id || pu._id)!, 'fail')}
                          className="px-3 py-2.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 text-xs font-bold"
                        >
                          Fail
                        </button>
                      </>
                    )}

                    {pu.status === PickupStatus.PICKED_UP && (
                      <div className="w-full text-center py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                        ✓ Pickup Completed Successfully
                      </div>
                    )}
                  </div>
                </div>
              ))}

            {/* DELIVERIES FEED */}
            {(activeTab === 'ALL' || activeTab === 'DELIVERIES') &&
              deliveries.map((del) => (
                <div
                  key={del.id || (del as any)._id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
                      DELIVERY · {del.deliveryNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {del.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {del.deliveryAddress?.name || 'Customer'}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-start gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
                      <span>
                        {del.deliveryAddress?.addressLine1}, {del.deliveryAddress?.area} (
                        {del.deliveryAddress?.pincode})
                      </span>
                    </p>
                  </div>

                  {/* Payment & Proof Bar */}
                  <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Collection Amount
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {del.collectionAmount && del.collectionAmount > 0
                          ? `₹${del.collectionAmount.toFixed(2)} Paid`
                          : 'Pending / Due'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {del.status !== DeliveryStatus.DELIVERED && (
                        <button
                          onClick={() => {
                            setSelectedDelivery(del);
                            setCollectModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[11px] shadow-sm active:scale-95"
                        >
                          Collect ₹
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedDelivery(del);
                          setRecipientName(
                            del.proofOfDelivery?.recipientName || del.deliveryAddress?.name || ''
                          );
                          setProofModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] active:scale-95"
                      >
                        Proof
                      </button>
                    </div>
                  </div>

                  {/* Quick Action Touch Bar */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={`tel:${del.deliveryAddress?.phone}`}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs active:scale-95 transition-transform"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      Call Customer
                    </a>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(
                        `${del.deliveryAddress?.addressLine1 || ''} ${del.deliveryAddress?.area || ''} ${
                          del.deliveryAddress?.city || ''
                        }`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs active:scale-95 transition-transform"
                    >
                      <Navigation className="w-3.5 h-3.5 text-primary-600" />
                      Map / Navigate
                    </a>
                  </div>

                  {/* Delivery Status Actions */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    {(del.status === DeliveryStatus.REQUESTED ||
                      del.status === DeliveryStatus.SCHEDULED ||
                      del.status === DeliveryStatus.ASSIGNED) && (
                      <button
                        onClick={() => handleDeliveryAction((del.id || del._id)!, 'start')}
                        className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-xs shadow-md shadow-primary-500/20 active:scale-98"
                      >
                        Start Delivery Trip
                      </button>
                    )}

                    {del.status === DeliveryStatus.OUT_FOR_DELIVERY && (
                      <>
                        <button
                          onClick={() => handleDeliveryAction((del.id || del._id)!, 'arrive')}
                          className="flex-1 py-2.5 rounded-xl bg-cyan-600 text-white font-bold text-xs active:scale-98"
                        >
                          Mark Arrived
                        </button>
                        <button
                          onClick={() => handleDeliveryAction((del.id || del._id)!, 'fail')}
                          className="px-3 py-2.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 text-xs font-bold"
                        >
                          Fail
                        </button>
                      </>
                    )}

                    {del.status === DeliveryStatus.ARRIVED && (
                      <>
                        <button
                          onClick={() => handleDeliveryAction((del.id || del._id)!, 'complete')}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-98"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Confirm Delivered
                        </button>
                        <button
                          onClick={() => handleDeliveryAction((del.id || del._id)!, 'fail')}
                          className="px-3 py-2.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 text-xs font-bold"
                        >
                          Fail
                        </button>
                      </>
                    )}

                    {del.status === DeliveryStatus.DELIVERED && (
                      <div className="w-full text-center py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                        ✓ Delivered Successfully
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </>
        )}
      </div>

      {/* QUICK CASH COLLECTION MODAL */}
      {collectModalOpen && selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-600" />
              Collect Doorstep Payment
            </h3>
            <form onSubmit={handleSaveCollection} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={collectAmount || ''}
                  onChange={(e) => setCollectAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 text-base font-extrabold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Method
                </label>
                <select
                  value={collectMethod}
                  onChange={(e) => setCollectMethod(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value={PaymentMethod.CASH}>Cash Payment</option>
                  <option value={PaymentMethod.UPI}>UPI QR Code</option>
                  <option value={PaymentMethod.CARD}>Card Machine</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCollectModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                >
                  Confirm Paid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK PROOF MODAL */}
      {proofModalOpen && selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary-500" />
              Proof of Delivery
            </h3>
            <form onSubmit={handleSaveProof} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Received By *
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Phone
                </label>
                <input
                  type="text"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Handover Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Delivered to customer at flat door"
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProofModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-primary-600 text-white shadow-md shadow-primary-500/20"
                >
                  Save Proof
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
