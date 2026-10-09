'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { shiftsApi } from '@/lib/api/shifts';
import { staffApi } from '@/lib/api/staff';
import { ShiftDefinition, ShiftAssignment, StaffProfile } from '@washora/shared';
import {
  Clock,
  Plus,
  ArrowLeft,
  Calendar,
  Users,
  CheckCircle2,
  Trash2,
  Sun,
  Moon,
  Coffee,
} from 'lucide-react';

export default function ShiftsPage() {
  const { activeBranch } = useApp();
  const [shifts, setShifts] = useState<ShiftDefinition[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Shift Modal
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [breakMinutes, setBreakMinutes] = useState('60');
  const [graceMinutes, setGraceMinutes] = useState('15');
  const [isOvernight, setIsOvernight] = useState(false);
  const [submittingShift, setSubmittingShift] = useState(false);

  // Assign Shift Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assignDate, setAssignDate] = useState(new Date().toISOString().split('T')[0]);
  const [submittingAssign, setSubmittingAssign] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [shiftsRes, assignRes, staffRes] = await Promise.all([
        shiftsApi.getShifts(),
        shiftsApi.getAssignments(),
        staffApi.getStaff({ limit: 100 }),
      ]);
      const sData = (shiftsRes as any)?.data || shiftsRes || [];
      const aData = (assignRes as any)?.data || assignRes || [];
      const stData = (staffRes as any)?.data?.items || (staffRes as any)?.items || [];
      setShifts(sData);
      setAssignments(aData);
      setStaffList(stData);
      if (sData.length > 0) setSelectedShiftId(sData[0].id || sData[0]._id);
      if (stData.length > 0) setSelectedStaffId(stData[0].id || stData[0]._id);
    } catch (err) {
      console.error('Failed to load shift data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingShift(true);
      await shiftsApi.createShift({
        name,
        code: code || name.toUpperCase().replace(/\s+/g, '_'),
        startTime,
        endTime,
        breakMinutes: Number(breakMinutes),
        graceMinutes: Number(graceMinutes),
        isOvernight,
      });
      setShowShiftModal(false);
      setName('');
      setCode('');
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to create shift');
    } finally {
      setSubmittingShift(false);
    }
  };

  const handleAssignShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingAssign(true);
      await shiftsApi.assignShift({
        branchId: activeBranch.id,
        staffId: selectedStaffId,
        shiftId: selectedShiftId,
        date: assignDate,
      });
      setShowAssignModal(false);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to assign shift');
    } finally {
      setSubmittingAssign(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Remove this shift assignment?')) return;
    try {
      await shiftsApi.deleteAssignment(id);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to remove assignment');
    }
  };

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
              <Clock className="w-8 h-8 text-primary-500" />
              Shift Management
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Configure plant work shifts, breaks, and daily employee schedule assignments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setShowShiftModal(true)} variant="outline" className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            New Shift
          </Button>
          <Button
            onClick={() => setShowAssignModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-1.5 shadow-lg shadow-primary-500/20"
          >
            <Users className="w-4 h-4" />
            Assign Staff
          </Button>
        </div>
      </div>

      {/* Shift Definitions Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Configured Plant Shifts</h3>
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading shifts...</div>
        ) : shifts.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No shifts created yet"
            description="Create morning, evening, or night plant shifts."
            actionLabel="Create Shift"
            onAction={() => setShowShiftModal(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {shifts.map((shift) => (
              <GlassCard key={shift.id || (shift as any)._id} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-primary-500/10 text-primary-600">
                      {shift.code}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">{shift.name}</h4>
                  </div>
                  {shift.isOvernight ? (
                    <Moon className="w-5 h-5 text-indigo-500" />
                  ) : (
                    <Sun className="w-5 h-5 text-amber-500" />
                  )}
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <p className="flex items-center justify-between">
                    <span className="font-medium text-slate-500">Working Hours:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {shift.startTime} — {shift.endTime}
                    </span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="font-medium text-slate-500">Break Time:</span>
                    <span>{shift.breakMinutes} mins</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="font-medium text-slate-500">Grace Period:</span>
                    <span>{shift.graceMinutes} mins</span>
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Shift Assignments Table */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Scheduled Assignments</h3>
        <GlassCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Shift</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Working Window</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      No shift assignments scheduled.
                    </td>
                  </tr>
                ) : (
                  assignments.map((a) => {
                    const staff = (a as any).staffId;
                    const user = staff?.userId;
                    const shift = (a as any).shiftId;
                    return (
                      <tr key={a.id || (a as any)._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/40">
                        <td className="px-5 py-3">
                          <p className="font-semibold text-slate-900 dark:text-white">{user?.name || 'Staff'}</p>
                          <p className="text-[11px] font-mono text-slate-400">{staff?.employeeCode}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-primary-500/10 text-primary-600">
                            {shift?.name || 'Assigned Shift'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs font-mono text-slate-700 dark:text-slate-300">{a.date}</td>
                        <td className="px-5 py-3 text-xs font-mono">
                          {shift?.startTime} — {shift?.endTime}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteAssignment(a.id || (a as any)._id)}
                            className="text-xs text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      {/* Create Shift Modal */}
      <Modal isOpen={showShiftModal} onClose={() => setShowShiftModal(false)} title="Create New Shift Definition">
        <form onSubmit={handleCreateShift} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Shift Name *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Morning Shift" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Shift Code</label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="MORNING" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Start Time (HH:mm) *</label>
              <Input value={startTime} onChange={(e) => setStartTime(e.target.value)} required placeholder="09:00" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">End Time (HH:mm) *</label>
              <Input value={endTime} onChange={(e) => setEndTime(e.target.value)} required placeholder="18:00" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Break (Minutes)</label>
              <Input type="number" value={breakMinutes} onChange={(e) => setBreakMinutes(e.target.value)} placeholder="60" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Grace (Minutes)</label>
              <Input type="number" value={graceMinutes} onChange={(e) => setGraceMinutes(e.target.value)} placeholder="15" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setShowShiftModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submittingShift}>
              {submittingShift ? 'Saving...' : 'Save Shift'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Shift Modal */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Staff to Shift">
        <form onSubmit={handleAssignShift} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Select Employee *</label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white"
            >
              {staffList.map((st) => (
                <option key={st.id || (st as any)._id} value={st.id || (st as any)._id}>
                  {st.employeeCode} — {(st as any).userId?.name || 'Staff'} ({st.designation || 'Operator'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Select Shift *</label>
            <select
              value={selectedShiftId}
              onChange={(e) => setSelectedShiftId(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white"
            >
              {shifts.map((s) => (
                <option key={s.id || (s as any)._id} value={s.id || (s as any)._id}>
                  {s.name} ({s.startTime} — {s.endTime})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Date *</label>
            <Input type="date" value={assignDate} onChange={(e) => setAssignDate(e.target.value)} required />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setShowAssignModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submittingAssign}>
              {submittingAssign ? 'Assigning...' : 'Confirm Assignment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
