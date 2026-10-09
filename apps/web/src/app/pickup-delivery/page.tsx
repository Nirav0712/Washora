'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  Calendar,
  Clock,
  User,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  Filter,
  DollarSign,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import {
  PickupRequest,
  DeliveryRequest,
  LogisticsDashboard,
  DeliveryAgentSummary,
  PickupStatus,
  DeliveryStatus,
  LogisticsPriority,
} from '@washora/shared';
import { logisticsApi } from '@/lib/api/logistics';
import { pickupsApi } from '@/lib/api/pickups';
import { deliveriesApi } from '@/lib/api/deliveries';

export default function PickupDeliveryHubPage() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<LogisticsDashboard | null>(null);
  const [agents, setAgents] = useState<DeliveryAgentSummary[]>([]);
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PICKUPS' | 'DELIVERIES' | 'AGENTS'>('OVERVIEW');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, pickRes, delRes, agentRes] = await Promise.all([
        logisticsApi.getDashboard(),
        pickupsApi.list({ limit: 50 }),
        deliveriesApi.list({ limit: 50 }),
        logisticsApi.getAgents(),
      ]);

      if (dashRes) setDashboard((dashRes as any).data || dashRes);
      const pList = (pickRes as any)?.data?.data || (pickRes as any)?.data || pickRes;
      if (Array.isArray(pList)) setPickups(pList);
      const dList = (delRes as any)?.data?.data || (delRes as any)?.data || delRes;
      if (Array.isArray(dList)) setDeliveries(dList);
      const aList = (agentRes as any)?.data || agentRes;
      if (Array.isArray(aList)) setAgents(aList);
    } catch (err) {
      console.error('Failed to load logistics data', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (paise?: number) => {
    if (paise === undefined || paise === null) return '₹0.00';
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getPriorityBadge = (priority: LogisticsPriority) => {
    switch (priority) {
      case LogisticsPriority.URGENT:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-700">URGENT</span>;
      case LogisticsPriority.HIGH:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-orange-100 text-orange-700">HIGH</span>;
      case LogisticsPriority.NORMAL:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-700">NORMAL</span>;
      case LogisticsPriority.LOW:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-700">LOW</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUESTED':
      case 'SCHEDULED':
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200">Scheduled</span>;
      case 'ASSIGNED':
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">Assigned</span>;
      case 'OUT_FOR_PICKUP':
      case 'OUT_FOR_DELIVERY':
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">Out on Route</span>;
      case 'ARRIVED':
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-50 text-purple-700 border border-purple-200">Arrived</span>;
      case 'PICKED_UP':
      case 'DELIVERED':
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">Completed</span>;
      case 'FAILED':
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-50 text-red-700 border border-red-200">Attempt Failed</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="h-7 w-7 text-blue-600" />
            Pickup & Delivery Logistics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time route operations, agent workload tracking, and doorstep service execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/pickups"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-sm"
          >
            <Package className="h-4 w-4 text-slate-500" />
            Manage Pickups
          </a>
          <a
            href="/deliveries"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            <Truck className="h-4 w-4" />
            Manage Deliveries
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Today's Pickups</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{dashboard?.todayPickupsCount || 0}</div>
          <span className="text-xs text-blue-600 font-medium mt-1 inline-block">Scheduled routes</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Today's Deliveries</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{dashboard?.todayDeliveriesCount || 0}</div>
          <span className="text-xs text-indigo-600 font-medium mt-1 inline-block">Dropoffs</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Unassigned</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">{dashboard?.pendingAssignmentCount || 0}</div>
          <span className="text-xs text-amber-600 font-medium mt-1 inline-block">Needs Driver</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">On The Road</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {(dashboard?.outForPickupCount || 0) + (dashboard?.outForDeliveryCount || 0)}
          </div>
          <span className="text-xs text-blue-600 font-medium mt-1 inline-block">Active transit</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Completed Today</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{dashboard?.completedTodayCount || 0}</div>
          <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">Delivered / Picked</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Doorstep Cash</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {formatCurrency(dashboard?.totalCashCollectedToday || 0)}
          </div>
          <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">Collected today</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`pb-3 border-b-2 flex items-center gap-2 ${
            activeTab === 'OVERVIEW' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Truck className="h-4 w-4" />
          Overview & Live Queue
        </button>
        <button
          onClick={() => setActiveTab('PICKUPS')}
          className={`pb-3 border-b-2 flex items-center gap-2 ${
            activeTab === 'PICKUPS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Package className="h-4 w-4" />
          Pickups ({pickups.length})
        </button>
        <button
          onClick={() => setActiveTab('DELIVERIES')}
          className={`pb-3 border-b-2 flex items-center gap-2 ${
            activeTab === 'DELIVERIES' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Truck className="h-4 w-4" />
          Deliveries ({deliveries.length})
        </button>
        <button
          onClick={() => setActiveTab('AGENTS')}
          className={`pb-3 border-b-2 flex items-center gap-2 ${
            activeTab === 'AGENTS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <User className="h-4 w-4" />
          Delivery Agents ({agents.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Workload by Agent */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900 text-base mb-4 flex items-center justify-between">
              <span>Agent Workload Today</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-normal">
                {agents.length} Agents Active
              </span>
            </h3>

            <div className="space-y-4">
              {agents.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">No delivery agents registered yet</div>
              ) : (
                agents.map((agent) => (
                  <div key={agent.agentId} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm text-slate-900">{agent.name}</div>
                        <div className="text-xs text-slate-500">{agent.employeeCode} {agent.phone ? `• ${agent.phone}` : ''}</div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                        {agent.todayPendingJobs} Pending
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center text-xs">
                      <div>
                        <span className="text-slate-400 block">Pickups</span>
                        <span className="font-semibold text-slate-700">{agent.todayCompletedPickups}/{agent.todayAssignedPickups}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Deliveries</span>
                        <span className="font-semibold text-slate-700">{agent.todayCompletedDeliveries}/{agent.todayAssignedDeliveries}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Collected</span>
                        <span className="font-semibold text-emerald-600">{formatCurrency(agent.todayCashCollected)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Live Recent Schedules */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pickups Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 text-sm">Recent Pickup Requests</h3>
                <a href="/pickups" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View All →</a>
              </div>
              <div className="divide-y divide-slate-100">
                {pickups.slice(0, 5).map((p) => (
                  <div key={p.id || p._id} className="p-4 flex items-center justify-between hover:bg-slate-50/60">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">{p.pickupNumber}</span>
                        {getPriorityBadge(p.priority)}
                        {getStatusBadge(p.status)}
                      </div>
                      <div className="text-xs text-slate-600 font-medium">
                        {(p.customer as any)?.name || 'Customer'} • {(p.customer as any)?.phone}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {p.pickupAddress?.addressLine1}, {p.pickupAddress?.area || p.pickupAddress?.city}
                      </div>
                    </div>

                    <div className="text-right text-xs text-slate-500 space-y-1">
                      <div>Scheduled: <span className="font-medium text-slate-700">{p.scheduledDate}</span></div>
                      <div>{p.scheduledTimeFrom ? `${p.scheduledTimeFrom} - ${p.scheduledTimeTo || ''}` : 'Anytime'}</div>
                      <div className="text-slate-400">Agent: {(p.assignedAgent as any)?.fullName || 'Unassigned'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deliveries Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 text-sm">Recent Deliveries</h3>
                <a href="/deliveries" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View All →</a>
              </div>
              <div className="divide-y divide-slate-100">
                {deliveries.slice(0, 5).map((d) => (
                  <div key={d.id || d._id} className="p-4 flex items-center justify-between hover:bg-slate-50/60">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">{d.deliveryNumber}</span>
                        {getPriorityBadge(d.priority)}
                        {getStatusBadge(d.status)}
                      </div>
                      <div className="text-xs text-slate-600 font-medium">
                        Order #{(d.order as any)?.orderNumber || 'Order'} • {(d.customer as any)?.name}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {d.deliveryAddress?.addressLine1}, {d.deliveryAddress?.area || d.deliveryAddress?.city}
                      </div>
                    </div>

                    <div className="text-right text-xs text-slate-500 space-y-1">
                      <div>Scheduled: <span className="font-medium text-slate-700">{d.scheduledDate}</span></div>
                      <div className="text-amber-600 font-semibold">Due: {formatCurrency((d.order as any)?.dueAmount || 0)}</div>
                      <div className="text-slate-400">Agent: {(d.assignedAgent as any)?.fullName || 'Unassigned'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Pickups */}
      {activeTab === 'PICKUPS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">All Scheduled Pickup Requests</h3>
            <a href="/pickups" className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100">
              Open Full Pickups Manager →
            </a>
          </div>
          <div className="divide-y divide-slate-100">
            {pickups.map((p) => (
              <div key={p.id || p._id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{p.pickupNumber}</span>
                    {getPriorityBadge(p.priority)}
                    {getStatusBadge(p.status)}
                  </div>
                  <div className="text-sm font-medium text-slate-800">
                    {(p.customer as any)?.name} ({(p.customer as any)?.phone})
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {p.pickupAddress?.addressLine1}, {p.pickupAddress?.area}, {p.pickupAddress?.city} - {p.pickupAddress?.pincode}
                  </div>
                </div>

                <div className="text-right text-xs space-y-1">
                  <div className="font-semibold text-slate-900">Date: {p.scheduledDate}</div>
                  <div className="text-slate-500">Slot: {p.scheduledTimeFrom ? `${p.scheduledTimeFrom} - ${p.scheduledTimeTo}` : 'Full Day'}</div>
                  <div className="text-slate-600">Assigned: {(p.assignedAgent as any)?.fullName || 'Unassigned'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Deliveries */}
      {activeTab === 'DELIVERIES' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">All Scheduled Deliveries</h3>
            <a href="/deliveries" className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100">
              Open Full Deliveries Manager →
            </a>
          </div>
          <div className="divide-y divide-slate-100">
            {deliveries.map((d) => (
              <div key={d.id || d._id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{d.deliveryNumber}</span>
                    {getPriorityBadge(d.priority)}
                    {getStatusBadge(d.status)}
                  </div>
                  <div className="text-sm font-medium text-slate-800">
                    Order #{(d.order as any)?.orderNumber} • {(d.customer as any)?.name} ({(d.customer as any)?.phone})
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {d.deliveryAddress?.addressLine1}, {d.deliveryAddress?.area}, {d.deliveryAddress?.city} - {d.deliveryAddress?.pincode}
                  </div>
                </div>

                <div className="text-right text-xs space-y-1">
                  <div className="font-semibold text-slate-900">Date: {d.scheduledDate}</div>
                  <div className="text-amber-600 font-bold">Outstanding Due: {formatCurrency((d.order as any)?.dueAmount || 0)}</div>
                  <div className="text-slate-600">Assigned: {(d.assignedAgent as any)?.fullName || 'Unassigned'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Delivery Agents */}
      {activeTab === 'AGENTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div key={agent.agentId} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{agent.name}</h4>
                  <div className="text-xs text-slate-500">{agent.employeeCode} {agent.phone ? `• ${agent.phone}` : ''}</div>
                </div>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded ${agent.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                  {agent.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg text-xs">
                <div>
                  <span className="text-slate-400 block">Assigned Pickups</span>
                  <span className="text-sm font-semibold text-slate-800">{agent.todayAssignedPickups}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Completed Pickups</span>
                  <span className="text-sm font-semibold text-emerald-600">{agent.todayCompletedPickups}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Assigned Deliveries</span>
                  <span className="text-sm font-semibold text-slate-800">{agent.todayAssignedDeliveries}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Completed Deliveries</span>
                  <span className="text-sm font-semibold text-emerald-600">{agent.todayCompletedDeliveries}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="text-slate-500">Doorstep Collections:</span>
                <span className="font-bold text-slate-900">{formatCurrency(agent.todayCashCollected)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
