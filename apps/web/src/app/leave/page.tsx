'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { leaveApi } from '@/lib/api/leave';
import { staffApi } from '@/lib/api/staff';
import { LeaveRequest, LeaveType, StaffProfile, LeaveStatus } from '@washora/shared';
import {
  Calendar,
  Plus,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  User,
  AlertCircle,
} from 'lucide-react';

export default function LeavePage() {
  const { activeBranch } = useApp();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');

  // Submit Leave Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalDays, setTotalDays] = useState('1');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reject Modal
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [leavesRes, typesRes, staffRes] = await Promise.all([
        leaveApi.getLeaveRequests({ status: activeTab !== 'ALL' ? activeTab : undefined }),
        leaveApi.getLeaveTypes(),
        staffApi.getStaff({ limit: 100 }),
      ]);

      const lData = (leavesRes as any)?.data?.items || (leavesRes as any)?.items || [];
      const tData = (typesRes as any)?.data || typesRes || [];
      const stData = (staffRes as any)?.data?.items || (staffRes as any)?.items || [];

      setLeaveRequests(lData);
      setLeaveTypes(tData);
      setStaffList(stData);

      if (tData.length > 0 && !selectedLeaveTypeId) {
        setSelectedLeaveTypeId(tData[0].id || tData[0]._id);
      }
      if (stData.length > 0 && !selectedStaffId) {
        setSelectedStaffId(stData[0].id || stData[0]._id);
      }
    } catch (err) {
      console.error('Failed to load leaves', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await leaveApi.createLeaveRequest({
        branchId: activeBranch.id,
        staffId: selectedStaffId,
        leaveTypeId: selectedLeaveTypeId,
        startDate,
        endDate,
        totalDays: Number(totalDays),
        reason,
      });
      setShowSubmitModal(false);
      setReason('');
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this leave request?')) return;
    try {
      await leaveApi.approveLeave(id);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Approval failed');
    }
  };

  const handleRejectConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingId) return;
    try {
      setSubmittingReject(true);
      await leaveApi.rejectLeave(rejectingId, rejectionReason);
      setRejectingId(null);
      setRejectionReason('');
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Rejection failed');
    } finally {
      setSubmittingReject(false);
    }
  };

  const pendingCount = leaveRequests.filter((l) => l.status === LeaveStatus.PENDING).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/attendance">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <Calendar className="w-8 h-8 text-primary-500" />
              Leave Management
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Review employee leave requests, approvals, balances, and absence workflows
            </p>
          </div>
        </div>

        <Button
          onClick={() => setShowSubmitModal(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-1.5 shadow-lg shadow-primary-500/20"
        >
          <Plus className="w-4 h-4" />
          Request Leave
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === tab
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.replace('_', ' ')}
            {tab === 'PENDING' && pendingCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-400 text-slate-900 font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Leave Requests Table */}
      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Leave Type</th>
                <th className="px-5 py-3">Dates</th>
                <th className="px-5 py-3">Days</th>
                <th className="px-5 py-3">Reason</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Loading leave requests...
                  </td>
                </tr>
              ) : leaveRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No leave requests found in this category.
                  </td>
                </tr>
              ) : (
                leaveRequests.map((req) => {
                  const staff = (req as any).staffId;
                  const user = staff?.userId;
                  const leaveType = (req as any).leaveTypeId;
                  return (
                    <tr key={req.id || (req as any)._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-900 dark:text-white">{user?.name || 'Staff'}</p>
                        <p className="text-[11px] font-mono text-slate-400">{staff?.employeeCode}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-primary-500/10 text-primary-600">
                          {leaveType?.name || 'Casual'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs font-mono">
                        {req.startDate} → {req.endDate}
                      </td>
                      <td className="px-5 py-3 text-xs font-bold text-slate-800 dark:text-slate-200">
                        {req.totalDays} {req.totalDays === 1 ? 'day' : 'days'}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {req.reason}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            req.status === LeaveStatus.APPROVED
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : req.status === LeaveStatus.REJECTED
                              ? 'bg-rose-500/10 text-rose-600'
                              : req.status === LeaveStatus.PENDING
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-slate-500/10 text-slate-500'
                          }`}
                        >
                          {req.status}
                        </span>
                        {req.rejectionReason && (
                          <p className="text-[10px] text-rose-500 mt-0.5">{req.rejectionReason}</p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {req.status === LeaveStatus.PENDING && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(req.id || (req as any)._id)}
                              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-2"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRejectingId(req.id || (req as any)._id)}
                              className="text-xs border-rose-500/30 text-rose-600 hover:bg-rose-500/10 h-7 px-2"
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Submit Leave Modal */}
      <Modal isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)} title="Submit Leave Request">
        <form onSubmit={handleSubmitLeave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Employee *</label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white"
            >
              {staffList.map((st) => (
                <option key={st.id || (st as any)._id} value={st.id || (st as any)._id}>
                  {st.employeeCode} — {(st as any).userId?.name || 'Staff'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Leave Type *</label>
            <select
              value={selectedLeaveTypeId}
              onChange={(e) => setSelectedLeaveTypeId(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white"
            >
              {leaveTypes.map((lt) => (
                <option key={lt.id || (lt as any)._id} value={lt.id || (lt as any)._id}>
                  {lt.name} ({lt.paid ? 'Paid' : 'Unpaid'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Start Date *</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">End Date *</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Total Days *</label>
            <Input type="number" step="0.5" value={totalDays} onChange={(e) => setTotalDays(e.target.value)} required />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Reason for Leave *</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} required placeholder="e.g. Personal family event" />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setShowSubmitModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal isOpen={!!rejectingId} onClose={() => setRejectingId(null)} title="Reject Leave Request">
        <form onSubmit={handleRejectConfirm} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Reason for Rejection (Required) *
            </label>
            <Input
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
              placeholder="e.g. Critical order delivery deadline during requested dates"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setRejectingId(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submittingReject}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {submittingReject ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
