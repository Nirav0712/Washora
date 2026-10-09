'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { payrollApi } from '@/lib/api/payroll';
import { staffApi } from '@/lib/api/staff';
import {
  PayrollPeriod,
  PayrollRecord,
  SalaryAdvance,
  StaffProfile,
  PayrollPeriodStatus,
  SalaryAdvanceStatus,
} from '@washora/shared';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Banknote,
  Plus,
  Play,
  CheckCircle2,
  DollarSign,
  Users,
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export default function PayrollPage() {
  const { activeBranch } = useApp();
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [activeTab, setActiveTab] = useState<'PAYROLL' | 'ADVANCES'>('PAYROLL');

  // Create Period Modal
  const [showCreatePeriod, setShowCreatePeriod] = useState(false);
  const [periodName, setPeriodName] = useState('October 2026');
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-31');
  const [submittingPeriod, setSubmittingPeriod] = useState(false);

  // Request Advance Modal
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceStaffId, setAdvanceStaffId] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('5000');
  const [advanceReason, setAdvanceReason] = useState('');
  const [submittingAdvance, setSubmittingAdvance] = useState(false);

  // Action states
  const [processing, setProcessing] = useState(false);
  const [approving, setApproving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [periodsRes, advancesRes, staffRes] = await Promise.all([
        payrollApi.getPayrollPeriods(),
        payrollApi.getSalaryAdvances(),
        staffApi.getStaff({ limit: 100 }),
      ]);

      const pData = (periodsRes as any)?.data || periodsRes || [];
      const advData = (advancesRes as any)?.data || advancesRes || [];
      const stData = (staffRes as any)?.data?.items || (staffRes as any)?.items || [];

      setPeriods(pData);
      setAdvances(advData);
      setStaffList(stData);

      if (pData.length > 0) {
        setSelectedPeriod(pData[0]);
        loadRecordsForPeriod(pData[0].id || (pData[0] as any)._id);
      }
      if (stData.length > 0) {
        setAdvanceStaffId(stData[0].id || stData[0]._id);
      }
    } catch (err) {
      console.error('Failed to load payroll data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecordsForPeriod = async (periodId: string) => {
    try {
      setLoadingRecords(true);
      const res = await payrollApi.getPayrollRecords(periodId);
      const data = (res as any)?.data || res || [];
      setRecords(data);
    } catch (err) {
      console.error('Failed to load payroll records', err);
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectPeriod = (period: PayrollPeriod) => {
    setSelectedPeriod(period);
    loadRecordsForPeriod(period.id || (period as any)._id);
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingPeriod(true);
      const res = await payrollApi.createPayrollPeriod({
        name: periodName,
        startDate,
        endDate,
      });
      setShowCreatePeriod(false);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to create payroll period');
    } finally {
      setSubmittingPeriod(false);
    }
  };

  const handleProcessPayroll = async () => {
    if (!selectedPeriod) return;
    try {
      setProcessing(true);
      const periodId = selectedPeriod.id || (selectedPeriod as any)._id;
      const res = await payrollApi.processPayrollPeriod(periodId);
      const updated = (res as any)?.data || res;
      setSelectedPeriod(updated);
      loadRecordsForPeriod(periodId);
      alert('Payroll processed successfully! Snapshot records calculated.');
    } catch (err: any) {
      alert(err?.message || 'Processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleApprovePayroll = async () => {
    if (!selectedPeriod) return;
    if (!confirm('Approve and lock this payroll period? This action creates immutable snapshot records.')) return;
    try {
      setApproving(true);
      const periodId = selectedPeriod.id || (selectedPeriod as any)._id;
      const res = await payrollApi.approvePayrollPeriod(periodId);
      const updated = (res as any)?.data || res;
      setSelectedPeriod(updated);
      loadRecordsForPeriod(periodId);
      alert('Payroll approved and locked!');
    } catch (err: any) {
      alert(err?.message || 'Approval failed');
    } finally {
      setApproving(false);
    }
  };

  const handleCreateAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingAdvance(true);
      await payrollApi.createSalaryAdvance({
        staffId: advanceStaffId,
        amount: Math.round(Number(advanceAmount) * 100), // paise
        reason: advanceReason,
      });
      setShowAdvanceModal(false);
      setAdvanceReason('');
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to request advance');
    } finally {
      setSubmittingAdvance(false);
    }
  };

  const handleApproveAdvance = async (id: string) => {
    try {
      await payrollApi.approveSalaryAdvance(id, selectedPeriod ? (selectedPeriod.id || (selectedPeriod as any)._id) : undefined);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Approval failed');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Banknote className="w-8 h-8 text-primary-500" />
            Payroll & Advances
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Deterministic server-calculated payroll, attendance-based deductions, and salary advances
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowAdvanceModal(true)}
            variant="outline"
            className="flex items-center gap-1.5"
          >
            <DollarSign className="w-4 h-4" />
            Request Advance
          </Button>

          <Button
            onClick={() => setShowCreatePeriod(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-1.5 shadow-lg shadow-primary-500/20"
          >
            <Plus className="w-4 h-4" />
            New Period
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('PAYROLL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'PAYROLL'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Payroll Periods
        </button>
        <button
          onClick={() => setActiveTab('ADVANCES')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'ADVANCES'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Salary Advances ({advances.filter((a) => a.status === SalaryAdvanceStatus.PENDING).length})
        </button>
      </div>

      {activeTab === 'PAYROLL' ? (
        <div className="space-y-6">
          {/* Period Selector & Actions */}
          <GlassCard className="p-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <label className="text-xs font-bold text-slate-500 uppercase">Period:</label>
                <select
                  value={selectedPeriod ? (selectedPeriod.id || (selectedPeriod as any)._id) : ''}
                  onChange={(e) => {
                    const p = periods.find((item) => (item.id || (item as any)._id) === e.target.value);
                    if (p) handleSelectPeriod(p);
                  }}
                  className="text-sm font-semibold px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white"
                >
                  {periods.map((p) => (
                    <option key={p.id || (p as any)._id} value={p.id || (p as any)._id}>
                      {p.name} ({p.status})
                    </option>
                  ))}
                </select>

                {selectedPeriod && (
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      selectedPeriod.status === PayrollPeriodStatus.APPROVED
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : selectedPeriod.status === PayrollPeriodStatus.PROCESSED
                        ? 'bg-blue-500/10 text-blue-600'
                        : 'bg-amber-500/10 text-amber-600'
                    }`}
                  >
                    {selectedPeriod.status}
                  </span>
                )}
              </div>

              {selectedPeriod && (
                <div className="flex items-center gap-2">
                  {selectedPeriod.status !== PayrollPeriodStatus.APPROVED && (
                    <Button
                      onClick={handleProcessPayroll}
                      disabled={processing}
                      variant="outline"
                      className="text-xs flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 text-primary-500" />
                      {processing ? 'Calculating...' : 'Run Calculation'}
                    </Button>
                  )}

                  {selectedPeriod.status === PayrollPeriodStatus.PROCESSED && (
                    <Button
                      onClick={handleApprovePayroll}
                      disabled={approving}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {approving ? 'Locking...' : 'Approve & Lock'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </GlassCard>

          {/* Metrics Row */}
          {selectedPeriod && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <GlassCard className="p-4">
                <p className="text-xs text-slate-500 font-medium">Total Gross Salary</p>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  ₹{((selectedPeriod.totalGross || 0) / 100).toLocaleString('en-IN')}
                </h3>
              </GlassCard>

              <GlassCard className="p-4">
                <p className="text-xs text-slate-500 font-medium">Deductions & Advances</p>
                <h3 className="text-xl font-bold text-rose-600 mt-1">
                  ₹{((selectedPeriod.totalDeductions || 0) / 100).toLocaleString('en-IN')}
                </h3>
              </GlassCard>

              <GlassCard className="p-4">
                <p className="text-xs text-slate-500 font-medium">Total Net Payout</p>
                <h3 className="text-xl font-bold text-emerald-600 mt-1">
                  ₹{((selectedPeriod.totalNet || 0) / 100).toLocaleString('en-IN')}
                </h3>
              </GlassCard>

              <GlassCard className="p-4">
                <p className="text-xs text-slate-500 font-medium">Staff Processed</p>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {selectedPeriod.totalStaffCount || records.length}
                </h3>
              </GlassCard>
            </div>
          )}

          {/* Payroll Snapshot Records Table */}
          <GlassCard className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3">Base</th>
                    <th className="px-5 py-3">Days (P / L / A)</th>
                    <th className="px-5 py-3">Overtime</th>
                    <th className="px-5 py-3">Allowances</th>
                    <th className="px-5 py-3">Deductions</th>
                    <th className="px-5 py-3">Advance</th>
                    <th className="px-5 py-3">Gross</th>
                    <th className="px-5 py-3 text-right">Net Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {loadingRecords ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        Loading payroll snapshot records...
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        No payroll calculations generated yet. Click &quot;Run Calculation&quot;.
                      </td>
                    </tr>
                  ) : (
                    records.map((rec) => {
                      const staff = (rec as any).staffId;
                      const user = staff?.userId;
                      return (
                        <tr key={rec.id || (rec as any)._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/40">
                          <td className="px-5 py-3">
                            <p className="font-semibold text-slate-900 dark:text-white">{user?.name || 'Staff'}</p>
                            <p className="text-[11px] font-mono text-slate-400">{staff?.employeeCode}</p>
                          </td>
                          <td className="px-5 py-3 text-xs font-mono">
                            ₹{((rec.baseSalary || 0) / 100).toLocaleString('en-IN')}
                          </td>
                          <td className="px-5 py-3 text-xs font-mono">
                            <span className="text-emerald-600 font-bold">{rec.presentDays}</span> /{' '}
                            <span className="text-blue-600">{rec.leaveDays}</span> /{' '}
                            <span className="text-rose-600">{rec.absentDays}</span>
                          </td>
                          <td className="px-5 py-3 text-xs font-mono text-amber-600">
                            {rec.overtimeAmount ? `₹${((rec.overtimeAmount || 0) / 100).toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="px-5 py-3 text-xs font-mono text-emerald-600">
                            {rec.totalAllowances ? `+₹${((rec.totalAllowances || 0) / 100).toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="px-5 py-3 text-xs font-mono text-rose-600">
                            {rec.totalDeductions ? `-₹${((rec.totalDeductions || 0) / 100).toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="px-5 py-3 text-xs font-mono text-rose-600">
                            {rec.advanceAmount ? `-₹${((rec.advanceAmount || 0) / 100).toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="px-5 py-3 text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                            ₹{((rec.grossSalary || 0) / 100).toLocaleString('en-IN')}
                          </td>
                          <td className="px-5 py-3 text-right font-mono font-bold text-emerald-600">
                            ₹{((rec.netSalary || 0) / 100).toLocaleString('en-IN')}
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
      ) : (
        /* Salary Advances Tab */
        <GlassCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Requested Date</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {advances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No salary advances recorded.
                    </td>
                  </tr>
                ) : (
                  advances.map((adv) => {
                    const staff = (adv as any).staffId;
                    const user = staff?.userId;
                    return (
                      <tr key={adv.id || (adv as any)._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/40">
                        <td className="px-5 py-3">
                          <p className="font-semibold text-slate-900 dark:text-white">{user?.name || 'Staff'}</p>
                          <p className="text-[11px] font-mono text-slate-400">{staff?.employeeCode}</p>
                        </td>
                        <td className="px-5 py-3 text-sm font-bold font-mono text-slate-900 dark:text-white">
                          ₹{((adv.amount || 0) / 100).toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3 text-xs font-mono">{adv.requestedDate}</td>
                        <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-400">{adv.reason}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              adv.status === SalaryAdvanceStatus.APPROVED
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : adv.status === SalaryAdvanceStatus.DEDUCTED
                                ? 'bg-blue-500/10 text-blue-600'
                                : adv.status === SalaryAdvanceStatus.REJECTED
                                ? 'bg-rose-500/10 text-rose-600'
                                : 'bg-amber-500/10 text-amber-600'
                            }`}
                          >
                            {adv.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {adv.status === SalaryAdvanceStatus.PENDING && (
                            <Button
                              size="sm"
                              onClick={() => handleApproveAdvance(adv.id || (adv as any)._id)}
                              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-2"
                            >
                              Approve
                            </Button>
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
      )}

      {/* Create Period Modal */}
      <Modal isOpen={showCreatePeriod} onClose={() => setShowCreatePeriod(false)} title="Create New Payroll Period">
        <form onSubmit={handleCreatePeriod} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Period Name *</label>
            <Input value={periodName} onChange={(e) => setPeriodName(e.target.value)} required placeholder="e.g. October 2026" />
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

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setShowCreatePeriod(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submittingPeriod}>
              {submittingPeriod ? 'Creating...' : 'Create Period'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Request Advance Modal */}
      <Modal isOpen={showAdvanceModal} onClose={() => setShowAdvanceModal(false)} title="Request Salary Advance">
        <form onSubmit={handleCreateAdvance} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Employee *</label>
            <select
              value={advanceStaffId}
              onChange={(e) => setAdvanceStaffId(e.target.value)}
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
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Advance Amount (₹) *</label>
            <Input type="number" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} required placeholder="5000" />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Reason *</label>
            <Input value={advanceReason} onChange={(e) => setAdvanceReason(e.target.value)} required placeholder="e.g. Urgent family expense" />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setShowAdvanceModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submittingAdvance}>
              {submittingAdvance ? 'Submitting...' : 'Request Advance'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
