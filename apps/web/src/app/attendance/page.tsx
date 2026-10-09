'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { attendanceApi } from '@/lib/api/attendance';
import { AttendanceRecord, AttendanceStatus, AttendanceSource } from '@washora/shared';
import { formatDate } from '@/lib/utils';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  LogOut,
  LogIn,
  AlertCircle,
  Calendar,
  Edit2,
  Users,
  Search,
  Filter,
} from 'lucide-react';

export default function AttendancePage() {
  const { activeBranch } = useApp();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Correction Modal
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [correctWorkMinutes, setCorrectWorkMinutes] = useState('480');
  const [correctOvertime, setCorrectOvertime] = useState('0');
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctStatus, setCorrectStatus] = useState<AttendanceStatus>(AttendanceStatus.PRESENT);
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

  // Check In/Out Loading
  const [actionLoading, setActionLoading] = useState(false);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const res = await attendanceApi.getAttendance({
        dateFrom: dateFilter || undefined,
        dateTo: dateFilter || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      const data = (res as any)?.data?.items || (res as any)?.items || [];
      setRecords(data);
    } catch (err) {
      console.error('Failed to load attendance', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [dateFilter, statusFilter]);

  const handleSelfCheckIn = async () => {
    try {
      setActionLoading(true);
      await attendanceApi.checkIn({ branchId: activeBranch.id, notes: 'Self check-in via dashboard' });
      alert('Checked in successfully!');
      loadAttendance();
    } catch (err: any) {
      alert(err?.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelfCheckOut = async () => {
    try {
      setActionLoading(true);
      await attendanceApi.checkOut({ notes: 'Self check-out via dashboard' });
      alert('Checked out successfully!');
      loadAttendance();
    } catch (err: any) {
      alert(err?.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCorrection = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setCorrectWorkMinutes(String(record.workMinutes || 480));
    setCorrectOvertime(String(record.overtimeMinutes || 0));
    setCorrectStatus(record.status);
    setCorrectionReason('');
  };

  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      setSubmittingCorrection(true);
      await attendanceApi.correctAttendance(selectedRecord.id || (selectedRecord as any)._id, {
        workMinutes: Number(correctWorkMinutes),
        overtimeMinutes: Number(correctOvertime),
        status: correctStatus,
        correctionReason,
      });
      setSelectedRecord(null);
      loadAttendance();
    } catch (err: any) {
      alert(err?.message || 'Failed to correct attendance');
    } finally {
      setSubmittingCorrection(false);
    }
  };

  const presentCount = records.filter((r) => r.status === AttendanceStatus.PRESENT).length;
  const lateCount = records.filter((r) => r.status === AttendanceStatus.LATE).length;
  const halfDayCount = records.filter((r) => r.status === AttendanceStatus.HALF_DAY).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <CalendarCheck className="w-8 h-8 text-primary-500" />
            Attendance & Shifts
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time biometric/web check-in, shift schedules, and manager correction logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/shifts">
            <Button variant="outline" size="sm">
              Manage Shifts
            </Button>
          </Link>
          <Link href="/leave">
            <Button variant="outline" size="sm">
              Leave Requests
            </Button>
          </Link>
          <Button
            onClick={handleSelfCheckIn}
            disabled={actionLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
          >
            <LogIn className="w-4 h-4" />
            Check In
          </Button>
          <Button
            onClick={handleSelfCheckOut}
            disabled={actionLoading}
            variant="outline"
            className="border-rose-500/30 text-rose-600 hover:bg-rose-500/10 flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            Check Out
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Present Today</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{presentCount}</h3>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Late Arrivals</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{lateCount}</h3>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Half Day</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{halfDayCount}</h3>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Date</p>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{dateFilter}</h3>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Filter Bar */}
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-48 text-xs"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-medium px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">All Status</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="LATE">Late</option>
              <option value="LEAVE">Leave</option>
            </select>
          </div>

          <p className="text-xs text-slate-400">{records.length} records found</p>
        </div>
      </GlassCard>

      {/* Attendance Records Table */}
      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Branch</th>
                <th className="px-5 py-3">Check In</th>
                <th className="px-5 py-3">Check Out</th>
                <th className="px-5 py-3">Work Hours</th>
                <th className="px-5 py-3">Overtime</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Loading attendance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No attendance records for selected date.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const staff = (r as any).staffId;
                  const user = staff?.userId;
                  const branch = (r as any).branchId;
                  return (
                    <tr key={r.id || (r as any)._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {user?.name || 'Staff Member'}
                            </p>
                            <p className="text-[11px] font-mono text-slate-400">{staff?.employeeCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-400">
                        {branch?.name || activeBranch.name}
                      </td>
                      <td className="px-5 py-3 text-xs font-mono">
                        {r.checkInAt ? new Date(r.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-5 py-3 text-xs font-mono">
                        {r.checkOutAt ? new Date(r.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {Math.round(((r.workMinutes || 0) / 60) * 10) / 10}h
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-amber-600">
                        {r.overtimeMinutes ? `${Math.round((r.overtimeMinutes / 60) * 10) / 10}h` : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            r.status === AttendanceStatus.PRESENT
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : r.status === AttendanceStatus.LATE
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-slate-500/10 text-slate-500'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenCorrection(r)}
                          className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 ml-auto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Correct
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

      {/* Attendance Correction Modal */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={`Manager Correction — ${selectedRecord?.date}`}
      >
        <form onSubmit={handleSaveCorrection} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</label>
              <select
                value={correctStatus}
                onChange={(e) => setCorrectStatus(e.target.value as AttendanceStatus)}
                className="w-full text-sm px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white"
              >
                <option value={AttendanceStatus.PRESENT}>Present</option>
                <option value={AttendanceStatus.HALF_DAY}>Half Day</option>
                <option value={AttendanceStatus.LATE}>Late</option>
                <option value={AttendanceStatus.LEAVE}>On Leave</option>
                <option value={AttendanceStatus.ABSENT}>Absent</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Work Minutes</label>
              <Input
                type="number"
                value={correctWorkMinutes}
                onChange={(e) => setCorrectWorkMinutes(e.target.value)}
                placeholder="480"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Overtime Minutes</label>
            <Input
              type="number"
              value={correctOvertime}
              onChange={(e) => setCorrectOvertime(e.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Correction Reason *</label>
            <Input
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              required
              placeholder="e.g. Employee punch missed due to power outage"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setSelectedRecord(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submittingCorrection}>
              {submittingCorrection ? 'Saving...' : 'Save Correction'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
