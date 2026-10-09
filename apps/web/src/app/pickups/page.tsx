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
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { pickupsApi } from '@/lib/api/pickups';
import { logisticsApi } from '@/lib/api/logistics';
import { PickupRequest, PickupStatus, LogisticsPriority, DeliveryAgentSummary } from '@washora/shared';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function PickupsPage() {
  const { tenant, activeBranch, customers } = useApp();
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [agents, setAgents] = useState<DeliveryAgentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [isPending, startTransition] = useTransition();

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [failModalOpen, setFailModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState<PickupRequest | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    customerId: '',
    addressLine1: '',
    addressLine2: '',
    area: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    landmark: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTimeFrom: '09:00',
    scheduledTimeTo: '12:00',
    priority: LogisticsPriority.NORMAL,
    customerNotes: '',
    specialInstructions: '',
  });

  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [failReason, setFailReason] = useState('CUSTOMER_NOT_AVAILABLE');
  const [failNote, setFailNote] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTimeFrom, setNewTimeFrom] = useState('10:00');
  const [newTimeTo, setNewTimeTo] = useState('13:00');
  const [rescheduleReason, setRescheduleReason] = useState('Customer requested later slot');

  const branchId = activeBranch.id || (activeBranch as any)._id;

  const fetchPickups = async () => {
    try {
      setLoading(true);
      const res = await pickupsApi.getAll({
        branchId,
        status: statusFilter !== 'ALL' ? (statusFilter as PickupStatus) : undefined,
      });
      if (res && res.data) {
        setPickups(res.data);
      }
    } catch (err) {
      console.error('Failed to load pickups:', err);
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
    fetchPickups();
    fetchAgents();
  }, [branchId, statusFilter]);

  const handleCreatePickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.addressLine1 || !formData.area) {
      alert('Please fill in required customer and address details');
      return;
    }
    const customer = customers.find((c) => c.id === formData.customerId || (c as any)._id === formData.customerId);

    try {
      await pickupsApi.create({
        branchId,
        customerId: formData.customerId,
        pickupAddress: {
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
      fetchPickups();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create pickup request');
    }
  };

  const handleAssign = async () => {
    if (!selectedPickup || !selectedAgentId) return;
    const targetId = (selectedPickup.id || selectedPickup._id)!;
    try {
      await pickupsApi.assign(targetId, { assignedAgentId: selectedAgentId });
      setAssignModalOpen(false);
      setSelectedPickup(null);
      fetchPickups();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign agent');
    }
  };

  const handleStart = async (id: string) => {
    try {
      await pickupsApi.start(id);
      fetchPickups();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start pickup');
    }
  };

  const handleArrive = async (id: string) => {
    try {
      await pickupsApi.arrive(id);
      fetchPickups();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to mark arrival');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await pickupsApi.complete(id);
      fetchPickups();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete pickup');
    }
  };

  const handleFail = async () => {
    if (!selectedPickup) return;
    const targetId = (selectedPickup.id || selectedPickup._id)!;
    try {
      await pickupsApi.fail(targetId, {
        reason: failReason as any,
        note: failNote,
      });
      setFailModalOpen(false);
      setSelectedPickup(null);
      fetchPickups();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record failure');
    }
  };

  const handleReschedule = async () => {
    if (!selectedPickup) return;
    const targetId = (selectedPickup.id || selectedPickup._id)!;
    try {
      await pickupsApi.reschedule(targetId, {
        scheduledDate: newDate,
        scheduledTimeFrom: newTimeFrom,
        scheduledTimeTo: newTimeTo,
        reason: rescheduleReason,
      });
      setRescheduleModalOpen(false);
      setSelectedPickup(null);
      fetchPickups();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reschedule pickup');
    }
  };

  const handleCancel = async (id: string) => {
    const reason = prompt('Please enter cancellation reason:');
    if (!reason) return;
    try {
      await pickupsApi.cancel(id, { reason });
      fetchPickups();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel pickup');
    }
  };

  const filteredPickups = pickups.filter((p) => {
    const q = search.toLowerCase();
    const matchNum = p.pickupNumber?.toLowerCase().includes(q);
    const matchName = p.pickupAddress?.name?.toLowerCase().includes(q);
    const matchArea = p.pickupAddress?.area?.toLowerCase().includes(q);
    const matchPhone = p.pickupAddress?.phone?.toLowerCase().includes(q);
    const matchesQuery = matchNum || matchName || matchArea || matchPhone;

    const matchesPriority = priorityFilter === 'ALL' || p.priority === priorityFilter;
    return matchesQuery && matchesPriority;
  });

  const getStatusBadge = (status: PickupStatus) => {
    switch (status) {
      case PickupStatus.REQUESTED:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200';
      case PickupStatus.SCHEDULED:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200';
      case PickupStatus.ASSIGNED:
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200';
      case PickupStatus.OUT_FOR_PICKUP:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200';
      case PickupStatus.ARRIVED:
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200';
      case PickupStatus.PICKED_UP:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200';
      case PickupStatus.FAILED:
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200';
      case PickupStatus.CANCELLED:
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pickup Operations</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Schedule, dispatch, and track customer garment doorstep pickups
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPickups}
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
            New Pickup Request
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
              placeholder="Search by PU#, customer name, phone, area..."
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
              <option value="OUT_FOR_PICKUP">Out For Pickup</option>
              <option value="ARRIVED">Arrived</option>
              <option value="PICKED_UP">Picked Up</option>
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

      {/* Pickups Table / Cards */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Pickup #</th>
                <th className="py-3.5 px-4">Customer & Phone</th>
                <th className="py-3.5 px-4">Address & Area</th>
                <th className="py-3.5 px-4">Schedule</th>
                <th className="py-3.5 px-4">Agent</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-500" />
                    Loading pickup requests...
                  </td>
                </tr>
              ) : filteredPickups.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    No pickup requests found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredPickups.map((pu) => {
                  const agentObj = agents.find((a) => a.agentId === pu.assignedAgentId);
                  return (
                    <tr key={pu.id || (pu as any)._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {pu.pickupNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-200">
                          {pu.pickupAddress?.name || 'Customer'}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {pu.pickupAddress?.phone || '—'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="truncate text-slate-800 dark:text-slate-200 font-medium">
                          {pu.pickupAddress?.addressLine1}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-primary-500 shrink-0" />
                          <span className="font-semibold text-slate-600 dark:text-slate-400">
                            {pu.pickupAddress?.area}
                          </span>
                          <span>· {pu.pickupAddress?.pincode}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {pu.scheduledDate ? new Date(pu.scheduledDate).toLocaleDateString() : 'Unscheduled'}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {pu.scheduledTimeFrom} - {pu.scheduledTimeTo}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {pu.assignedAgentId ? (
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
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                            pu.priority === LogisticsPriority.URGENT
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                              : pu.priority === LogisticsPriority.HIGH
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          )}
                        >
                          {pu.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block',
                            getStatusBadge(pu.status)
                          )}
                        >
                          {pu.status.replace(/_/g, ' ')}
                        </span>
                        {pu.attemptCount && pu.attemptCount > 0 ? (
                          <span className="text-[10px] text-slate-400 ml-1.5 font-medium">
                            ({pu.attemptCount} att)
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Assign button */}
                          {(pu.status === PickupStatus.REQUESTED ||
                            pu.status === PickupStatus.SCHEDULED ||
                            pu.status === PickupStatus.FAILED) && (
                            <button
                              onClick={() => {
                                setSelectedPickup(pu);
                                setSelectedAgentId(pu.assignedAgentId || '');
                                setAssignModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 text-[11px] font-semibold hover:bg-primary-100 transition-colors"
                            >
                              Assign
                            </button>
                          )}

                          {/* Start pickup */}
                          {pu.status === PickupStatus.ASSIGNED && (
                            <button
                              onClick={() => handleStart((pu.id || pu._id)!)}
                              className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 text-[11px] font-semibold hover:bg-purple-100 transition-colors"
                            >
                              Start
                            </button>
                          )}

                          {/* Arrived */}
                          {pu.status === PickupStatus.OUT_FOR_PICKUP && (
                            <button
                              onClick={() => handleArrive((pu.id || pu._id)!)}
                              className="px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 text-[11px] font-semibold hover:bg-cyan-100 transition-colors"
                            >
                              Arrived
                            </button>
                          )}

                          {/* Complete */}
                          {(pu.status === PickupStatus.OUT_FOR_PICKUP || pu.status === PickupStatus.ARRIVED) && (
                            <button
                              onClick={() => handleComplete((pu.id || pu._id)!)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[11px] font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Pick Up
                            </button>
                          )}

                          {/* Fail */}
                          {(pu.status === PickupStatus.OUT_FOR_PICKUP || pu.status === PickupStatus.ARRIVED) && (
                            <button
                              onClick={() => {
                                setSelectedPickup(pu);
                                setFailModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-[11px] font-semibold hover:bg-rose-100 transition-colors"
                            >
                              Fail
                            </button>
                          )}

                          {/* Reschedule */}
                          {pu.status === PickupStatus.FAILED && (
                            <button
                              onClick={() => {
                                setSelectedPickup(pu);
                                setRescheduleModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-[11px] font-semibold hover:bg-amber-100 transition-colors flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Reschedule
                            </button>
                          )}

                          {/* Cancel */}
                          {pu.status !== PickupStatus.PICKED_UP &&
                            pu.status !== PickupStatus.CANCELLED && (
                              <button
                                onClick={() => handleCancel((pu.id || pu._id)!)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                title="Cancel Pickup"
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

      {/* CREATE PICKUP MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Create Doorstep Pickup</h3>
                <p className="text-xs text-slate-500">Request clothes collection from customer address</p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreatePickup} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer *
                </label>
                <select
                  required
                  value={formData.customerId}
                  onChange={(e) => {
                    const cid = e.target.value;
                    const cust = customers.find((c) => c.id === cid || (c as any)._id === cid);
                    setFormData({
                      ...formData,
                      customerId: cid,
                      addressLine1: cust?.address || '',
                    });
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id || (c as any)._id} value={c.id || (c as any)._id}>
                      {c.name} ({c.phone})
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
                    placeholder="e.g. Bandra West"
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
                    placeholder="400050"
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
                    placeholder="Near City Bank"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer / Special Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Ring the bell twice, handle silk saree with care..."
                  value={formData.specialInstructions}
                  onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-md shadow-primary-500/20"
                >
                  Create Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN AGENT MODAL */}
      {assignModalOpen && selectedPickup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white">
              Assign Delivery Agent to {selectedPickup.pickupNumber}
            </h3>
            <p className="text-xs text-slate-500">
              Select an active delivery agent to handle this garment pickup.
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

      {/* FAIL PICKUP MODAL */}
      {failModalOpen && selectedPickup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-rose-600 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Mark Pickup as Failed
            </h3>
            <p className="text-xs text-slate-500">
              Record failure reason for {selectedPickup.pickupNumber}. You can reschedule it subsequently.
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
                <option value="WRONG_ADDRESS">Wrong Address / Incomplete Landmark</option>
                <option value="CUSTOMER_CANCELLED">Customer Refused / Cancelled at Door</option>
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
      {rescheduleModalOpen && selectedPickup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-500" />
              Reschedule Pickup {selectedPickup.pickupNumber}
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
