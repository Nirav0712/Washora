'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  Plus,
  Search,
  Filter,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Truck,
  RotateCcw,
  Eye,
  RefreshCw,
  Banknote,
  FileCheck,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { deliveriesApi } from '@/lib/api/deliveries';
import { logisticsApi } from '@/lib/api/logistics';
import { DeliveryRequest, DeliveryStatus, LogisticsPriority, DeliveryAgentSummary, PaymentMethod, OrderStatus } from '@washora/shared';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function DeliveriesPage() {
  const { tenant, activeBranch, customers, orders } = useApp();
  const [deliveries, setDeliveries] = useState<DeliveryRequest[]>([]);
  const [agents, setAgents] = useState<DeliveryAgentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [failModalOpen, setFailModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRequest | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    orderId: '',
    customerId: '',
    addressLine1: '',
    addressLine2: '',
    area: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    landmark: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTimeFrom: '14:00',
    scheduledTimeTo: '18:00',
    priority: LogisticsPriority.NORMAL,
    customerNotes: '',
    specialInstructions: '',
  });

  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [failReason, setFailReason] = useState('CUSTOMER_NOT_AVAILABLE');
  const [failNote, setFailNote] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTimeFrom, setNewTimeFrom] = useState('14:00');
  const [newTimeTo, setNewTimeTo] = useState('18:00');
  const [rescheduleReason, setRescheduleReason] = useState('Customer requested later slot');

  // Payment Collection
  const [collectionAmount, setCollectionAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [collectionNotes, setCollectionNotes] = useState('');

  // Proof of Delivery
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const branchId = activeBranch.id || (activeBranch as any)._id;

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const res = await deliveriesApi.getAll({
        branchId,
        status: statusFilter !== 'ALL' ? (statusFilter as DeliveryStatus) : undefined,
      });
      if (res && res.data) {
        setDeliveries(res.data);
      }
    } catch (err) {
      console.error('Failed to load deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await logisticsApi.getAgents({ branchId });
      if (res && res.data) {
        setAgents(res.data);
      }
    } catch (err) {
      console.error('Failed to load agents:', err);
    }
  };

  useEffect(() => {
    fetchDeliveries();
    fetchAgents();
  }, [branchId, statusFilter]);

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orderId || !formData.customerId || !formData.addressLine1) {
      alert('Please fill in required order, customer, and address details');
      return;
    }
    const customer = customers.find((c) => c.id === formData.customerId || (c as any)._id === formData.customerId);

    try {
      await deliveriesApi.create({
        branchId,
        orderId: formData.orderId,
        customerId: formData.customerId,
        deliveryAddress: {
          name: customer?.name || 'Customer',
          phone: customer?.phone || '9999999999',
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          area: formData.area,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          landmark: formData.landmark,
        },
        scheduledDate: formData.scheduledDate,
        scheduledTimeFrom: formData.scheduledTimeFrom,
        scheduledTimeTo: formData.scheduledTimeTo,
        priority: formData.priority,
        customerNotes: formData.customerNotes,
        specialInstructions: formData.specialInstructions,
      });
      setCreateModalOpen(false);
      fetchDeliveries();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create delivery request');
    }
  };

  const handleAssign = async () => {
    if (!selectedDelivery || !selectedAgentId) return;
    const targetId = (selectedDelivery.id || selectedDelivery._id)!;
    try {
      await deliveriesApi.assign(targetId, { assignedAgentId: selectedAgentId });
      setAssignModalOpen(false);
      setSelectedDelivery(null);
      fetchDeliveries();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign agent');
    }
  };

  const handleStart = async (id: string) => {
    try {
      await deliveriesApi.start(id);
      fetchDeliveries();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start delivery');
    }
  };

  const handleArrive = async (id: string) => {
    try {
      await deliveriesApi.arrive(id);
      fetchDeliveries();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to mark arrival');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await deliveriesApi.complete(id);
      fetchDeliveries();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to mark delivered');
    }
  };

  const handleFail = async () => {
    if (!selectedDelivery) return;
    const targetId = (selectedDelivery.id || selectedDelivery._id)!;
    try {
      await deliveriesApi.fail(targetId, {
        reason: failReason as any,
        note: failNote,
      });
      setFailModalOpen(false);
      setSelectedDelivery(null);
      fetchDeliveries();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record failure');
    }
  };

  const handleReschedule = async () => {
    if (!selectedDelivery) return;
    const targetId = (selectedDelivery.id || selectedDelivery._id)!;
    try {
      await deliveriesApi.reschedule(targetId, {
        scheduledDate: newDate,
        scheduledTimeFrom: newTimeFrom,
        scheduledTimeTo: newTimeTo,
        reason: rescheduleReason,
      });
      setRescheduleModalOpen(false);
      setSelectedDelivery(null);
      fetchDeliveries();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reschedule delivery');
    }
  };

  const handleRecordCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery || collectionAmount <= 0) return;
    const targetId = (selectedDelivery.id || selectedDelivery._id)!;
    try {
      await deliveriesApi.recordCollection(targetId, {
        amount: collectionAmount,
        paymentMethod,
        notes: collectionNotes,
      });
      setCollectionModalOpen(false);
      setSelectedDelivery(null);
      fetchDeliveries();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record collection');
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
        signatureUrl,
        photoUrl,
      });
      setProofModalOpen(false);
      setSelectedDelivery(null);
      fetchDeliveries();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save proof of delivery');
    }
  };

  const handleCancel = async (id: string) => {
    const reason = prompt('Please enter cancellation reason:');
    if (!reason) return;
    try {
      await deliveriesApi.cancel(id, { reason });
      fetchDeliveries();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel delivery');
    }
  };

  const filteredDeliveries = deliveries.filter((d) => {
    const q = search.toLowerCase();
    const matchNum = d.deliveryNumber?.toLowerCase().includes(q);
    const matchName = d.deliveryAddress?.name?.toLowerCase().includes(q);
    const matchArea = d.deliveryAddress?.area?.toLowerCase().includes(q);
    const matchPhone = d.deliveryAddress?.phone?.toLowerCase().includes(q);
    const matchesQuery = matchNum || matchName || matchArea || matchPhone;

    const matchesPriority = priorityFilter === 'ALL' || d.priority === priorityFilter;
    return matchesQuery && matchesPriority;
  });

  const getStatusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case DeliveryStatus.REQUESTED:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200';
      case DeliveryStatus.SCHEDULED:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200';
      case DeliveryStatus.ASSIGNED:
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200';
      case DeliveryStatus.OUT_FOR_DELIVERY:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200';
      case DeliveryStatus.ARRIVED:
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200';
      case DeliveryStatus.DELIVERED:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200';
      case DeliveryStatus.FAILED:
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200';
      case DeliveryStatus.CANCELLED:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/pickup-delivery" className="text-sm font-medium text-primary-600 hover:underline">
              Logistics Hub
            </Link>
            <span className="text-slate-400">/</span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Delivery Operations</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dispatch, track, collect payment, and verify proof of delivery
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDeliveries}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold text-sm shadow-md shadow-primary-500/20 hover:from-primary-700 hover:to-primary-600 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Delivery Request
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by DEL#, customer name, phone, area..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="REQUESTED">Requested</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="OUT_FOR_DELIVERY">Out For Delivery</option>
              <option value="ARRIVED">Arrived</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Delivery #</th>
                <th className="py-3.5 px-4">Customer & Phone</th>
                <th className="py-3.5 px-4">Address & Area</th>
                <th className="py-3.5 px-4">Schedule</th>
                <th className="py-3.5 px-4">Agent</th>
                <th className="py-3.5 px-4">Collection</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-500" />
                    Loading delivery requests...
                  </td>
                </tr>
              ) : filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    No delivery requests found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((del) => {
                  const agentObj = agents.find((a) => a.agentId === del.assignedAgentId);
                  return (
                    <tr key={del.id || (del as any)._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {del.deliveryNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-200">
                          {del.deliveryAddress?.name || 'Customer'}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {del.deliveryAddress?.phone || '—'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="truncate text-slate-800 dark:text-slate-200 font-medium">
                          {del.deliveryAddress?.addressLine1}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-primary-500 shrink-0" />
                          <span className="font-semibold text-slate-600 dark:text-slate-400">
                            {del.deliveryAddress?.area}
                          </span>
                          <span>· {del.deliveryAddress?.pincode}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {del.scheduledDate ? new Date(del.scheduledDate).toLocaleDateString() : 'Unscheduled'}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {del.scheduledTimeFrom} - {del.scheduledTimeTo}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {del.assignedAgentId ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 text-[10px] font-bold flex items-center justify-center">
                              DA
                            </div>
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {agentObj?.name || 'Assigned Agent'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-200/50">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {del.collectionAmount && del.collectionAmount > 0 ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md border border-emerald-200/60">
                            ₹{del.collectionAmount.toFixed(2)} Paid
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">None</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block',
                            getStatusBadge(del.status)
                          )}
                        >
                          {del.status.replace(/_/g, ' ')}
                        </span>
                        {del.attemptCount && del.attemptCount > 0 ? (
                          <span className="text-[10px] text-slate-400 ml-1.5 font-medium">
                            ({del.attemptCount} att)
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Assign button */}
                          {(del.status === DeliveryStatus.REQUESTED ||
                            del.status === DeliveryStatus.SCHEDULED ||
                            del.status === DeliveryStatus.FAILED) && (
                            <button
                              onClick={() => {
                                setSelectedDelivery(del);
                                setSelectedAgentId(del.assignedAgentId || '');
                                setAssignModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 text-[11px] font-semibold hover:bg-primary-100 transition-colors"
                            >
                              Assign
                            </button>
                          )}

                          {/* Start delivery */}
                          {del.status === DeliveryStatus.ASSIGNED && (
                            <button
                              onClick={() => handleStart((del.id || del._id)!)}
                              className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 text-[11px] font-semibold hover:bg-purple-100 transition-colors"
                            >
                              Start
                            </button>
                          )}

                          {/* Arrived */}
                          {del.status === DeliveryStatus.OUT_FOR_DELIVERY && (
                            <button
                              onClick={() => handleArrive((del.id || del._id)!)}
                              className="px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 text-[11px] font-semibold hover:bg-cyan-100 transition-colors"
                            >
                              Arrived
                            </button>
                          )}

                          {/* Collect payment */}
                          {(del.status === DeliveryStatus.OUT_FOR_DELIVERY ||
                            del.status === DeliveryStatus.ARRIVED) && (
                            <button
                              onClick={() => {
                                setSelectedDelivery(del);
                                setCollectionModalOpen(true);
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[11px] font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1"
                              title="Collect Payment"
                            >
                              <Banknote className="w-3 h-3" />
                              Pay
                            </button>
                          )}

                          {/* Proof */}
                          {(del.status === DeliveryStatus.OUT_FOR_DELIVERY ||
                            del.status === DeliveryStatus.ARRIVED ||
                            del.status === DeliveryStatus.DELIVERED) && (
                            <button
                              onClick={() => {
                                setSelectedDelivery(del);
                                setRecipientName(del.proofOfDelivery?.recipientName || del.deliveryAddress?.name || '');
                                setRecipientPhone(del.proofOfDelivery?.recipientPhone || del.deliveryAddress?.phone || '');
                                setDeliveryNote(del.proofOfDelivery?.deliveryNote || '');
                                setProofModalOpen(true);
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[11px] font-semibold hover:bg-slate-200 transition-colors flex items-center gap-1"
                              title="Proof of Delivery"
                            >
                              <FileCheck className="w-3 h-3" />
                              Proof
                            </button>
                          )}

                          {/* Complete / Deliver */}
                          {(del.status === DeliveryStatus.OUT_FOR_DELIVERY || del.status === DeliveryStatus.ARRIVED) && (
                            <button
                              onClick={() => handleComplete((del.id || del._id)!)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Deliver
                            </button>
                          )}

                          {/* Fail */}
                          {(del.status === DeliveryStatus.OUT_FOR_DELIVERY || del.status === DeliveryStatus.ARRIVED) && (
                            <button
                              onClick={() => {
                                setSelectedDelivery(del);
                                setFailModalOpen(true);
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-[11px] font-semibold hover:bg-rose-100 transition-colors"
                            >
                              Fail
                            </button>
                          )}

                          {/* Reschedule */}
                          {del.status === DeliveryStatus.FAILED && (
                            <button
                              onClick={() => {
                                setSelectedDelivery(del);
                                setRescheduleModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-[11px] font-semibold hover:bg-amber-100 transition-colors flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Reschedule
                            </button>
                          )}

                          {/* Cancel */}
                          {del.status !== DeliveryStatus.DELIVERED &&
                            del.status !== DeliveryStatus.CANCELLED && (
                              <button
                                onClick={() => handleCancel((del.id || del._id)!)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                title="Cancel Delivery"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE DELIVERY MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Create Doorstep Delivery</h3>
                <p className="text-xs text-slate-500">Dispatch ready laundry order to customer</p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateDelivery} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Order *
                </label>
                <select
                  required
                  value={formData.orderId}
                  onChange={(e) => {
                    const oid = e.target.value;
                    const ord = orders.find((o) => o.id === oid || (o as any)._id === oid);
                    if (ord) {
                      const cust = customers.find((c) => c.id === ord.customerId || (c as any)._id === ord.customerId);
                      setFormData({
                        ...formData,
                        orderId: oid,
                        customerId: ord.customerId,
                        addressLine1: cust?.address || '',
                      });
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">Select ready order...</option>
                  {orders
                    .filter((o) => o.orderStatus === OrderStatus.READY || o.orderStatus === OrderStatus.PACKED || o.orderStatus === OrderStatus.PROCESSING)
                    .map((o) => (
                      <option key={o.id || (o as any)._id} value={o.id || (o as any)._id}>
                        {o.orderNumber} — {o.customer?.name || (o as any).customerName || 'Customer'} (₹{o.grandTotal || (o as any).totalAmount || 0})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Flat / Building / Street"
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Area / Locality *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Worli"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="400018"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    From
                  </label>
                  <input
                    type="time"
                    value={formData.scheduledTimeFrom}
                    onChange={(e) => setFormData({ ...formData, scheduledTimeFrom: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    To
                  </label>
                  <input
                    type="time"
                    value={formData.scheduledTimeTo}
                    onChange={(e) => setFormData({ ...formData, scheduledTimeTo: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value={LogisticsPriority.NORMAL}>Normal</option>
                    <option value={LogisticsPriority.HIGH}>High</option>
                    <option value={LogisticsPriority.URGENT}>Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Landmark
                  </label>
                  <input
                    type="text"
                    placeholder="Opposite Metro Station"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-md shadow-primary-500/20"
                >
                  Create Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN AGENT MODAL */}
      {assignModalOpen && selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white">
              Assign Delivery Agent to {selectedDelivery.deliveryNumber}
            </h3>
            <p className="text-xs text-slate-500">
              Select an active delivery agent to deliver clean clothes.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Agent
              </label>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Select agent...</option>
                {agents.map((ag) => (
                  <option key={ag.agentId} value={ag.agentId}>
                    {ag.name} ({ag.phone || 'No Phone'}) — {ag.todayAssignedPickups} pickups, {ag.todayAssignedDeliveries} deliveries
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssign}
                disabled={!selectedAgentId}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT / COLLECTION MODAL */}
      {collectionModalOpen && selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-emerald-600 flex items-center gap-2">
              <Banknote className="w-5 h-5" />
              Collect Doorstep Payment
            </h3>
            <p className="text-xs text-slate-500">
              Record payment collected for {selectedDelivery.deliveryNumber}. Updates existing ledger.
            </p>

            <form onSubmit={handleRecordCollection} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Collection Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={collectionAmount || ''}
                  onChange={(e) => setCollectionAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value={PaymentMethod.CASH}>Cash</option>
                  <option value={PaymentMethod.UPI}>UPI QR Code</option>
                  <option value={PaymentMethod.CARD}>Card Machine / POS</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Collected exact cash from customer"
                  value={collectionNotes}
                  onChange={(e) => setCollectionNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCollectionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Save Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROOF OF DELIVERY MODAL */}
      {proofModalOpen && selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary-500" />
              Proof of Delivery — {selectedDelivery.deliveryNumber}
            </h3>

            <form onSubmit={handleSaveProof} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Name *
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
                  Delivery Note
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Handed over to security guard at reception"
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setProofModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary-600 text-white hover:bg-primary-700"
                >
                  Save Proof
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAIL DELIVERY MODAL */}
      {failModalOpen && selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-rose-600 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Mark Delivery as Failed
            </h3>
            <p className="text-xs text-slate-500">
              Record failure reason for {selectedDelivery.deliveryNumber}. You can reschedule it subsequently.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Failure Reason *
              </label>
              <select
                value={failReason}
                onChange={(e) => setFailReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="CUSTOMER_NOT_AVAILABLE">Customer Not Available / Door Locked</option>
                <option value="PHONE_UNREACHABLE">Phone Unreachable / Switched Off</option>
                <option value="CUSTOMER_REFUSED">Customer Refused Delivery</option>
                <option value="PAYMENT_PENDING">Customer Refused Payment</option>
                <option value="WRONG_ADDRESS">Wrong Address / Incomplete Landmark</option>
                <option value="ACCESS_ISSUE">Gated Access / Security Issue</option>
                <option value="OTHER">Other Reason</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Additional Note
              </label>
              <textarea
                rows={2}
                placeholder="Agent note explaining the attempt..."
                value={failNote}
                onChange={(e) => setFailNote(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setFailModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFail}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700"
              >
                Confirm Failure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {rescheduleModalOpen && selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-500" />
              Reschedule Delivery {selectedDelivery.deliveryNumber}
            </h3>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Date *
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  From
                </label>
                <input
                  type="time"
                  value={newTimeFrom}
                  onChange={(e) => setNewTimeFrom(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  To
                </label>
                <input
                  type="time"
                  value={newTimeTo}
                  onChange={(e) => setNewTimeTo(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reschedule Reason
              </label>
              <input
                type="text"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRescheduleModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReschedule}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
