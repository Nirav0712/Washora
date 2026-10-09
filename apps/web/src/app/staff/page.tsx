'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { staffApi } from '@/lib/api/staff';
import { StaffProfile, StaffWorkSummary, EmploymentType, StaffStatus, RoleType, SalaryType } from '@washora/shared';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  UserCheck,
  Search,
  Plus,
  Phone,
  Mail,
  Building,
  Shield,
  Briefcase,
  Activity,
  Award,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Calendar,
} from 'lucide-react';

export default function StaffPage() {
  const { activeBranch } = useApp();
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [employmentFilter, setEmploymentFilter] = useState('ALL');

  // Create Staff Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleCode, setRoleCode] = useState<RoleType>(RoleType.OPERATOR);
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('Plant Operations');
  const [employmentType, setEmploymentType] = useState<EmploymentType>(EmploymentType.FULL_TIME);
  const [baseSalary, setBaseSalary] = useState('25000');
  const [submitting, setSubmitting] = useState(false);

  // Work Summary Detail Modal
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);
  const [workSummary, setWorkSummary] = useState<StaffWorkSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const res = await staffApi.getStaff({
        search: searchQuery || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        employmentType: employmentFilter !== 'ALL' ? employmentFilter : undefined,
      });
      const data = (res as any)?.data?.items || (res as any)?.items || [];
      setStaffList(data);
    } catch (err) {
      console.error('Failed to load staff', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [searchQuery, statusFilter, employmentFilter]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await staffApi.createStaff({
        name,
        email,
        phone,
        roleCode,
        designation,
        department,
        employmentType,
        primaryBranchId: activeBranch.id,
        salaryConfiguration: {
          salaryType: SalaryType.MONTHLY,
          baseSalary: Math.round(Number(baseSalary) * 100), // convert INR to paise
          effectiveFrom: new Date().toISOString().split('T')[0],
        },
      });
      setShowCreateModal(false);
      setName('');
      setEmail('');
      setPhone('');
      setDesignation('');
      loadStaff();
    } catch (err: any) {
      alert(err?.message || 'Failed to create staff member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewSummary = async (staff: StaffProfile) => {
    setSelectedStaff(staff);
    setLoadingSummary(true);
    try {
      const res = await staffApi.getWorkSummary(staff.id || (staff as any)._id);
      const data = (res as any)?.data || res;
      setWorkSummary(data);
    } catch (err) {
      console.error('Failed to fetch work summary', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this staff member?')) return;
    try {
      await staffApi.deactivateStaff(id);
      loadStaff();
    } catch (err: any) {
      alert(err?.message || 'Failed to deactivate staff');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-primary-500" />
            Staff & Workforce
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage employee profiles, roles, branch assignments, and operational output
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Staff Member
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Staff</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{staffList.length}</h3>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Active Staff</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {staffList.filter((s) => s.status === StaffStatus.ACTIVE).length}
              </h3>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Full-Time</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {staffList.filter((s) => s.employmentType === EmploymentType.FULL_TIME).length}
              </h3>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Active Branch</p>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{activeBranch.name}</h3>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Filter Bar */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code, name, designation..."
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-medium px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            <select
              value={employmentFilter}
              onChange={(e) => setEmploymentFilter(e.target.value)}
              className="text-xs font-medium px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">All Employment Types</option>
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Staff Table / Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading workforce profiles...</div>
      ) : staffList.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No staff members found"
          description="Add your first laundry operator, QC inspector, or manager profile."
          actionLabel="Add Staff"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map((staff) => {
            const user = (staff as any).userId;
            const branch = (staff as any).primaryBranchId;
            return (
              <GlassCard key={staff.id || (staff as any)._id} className="p-5 flex flex-col justify-between hover:border-primary-500/30 transition-all">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary-500/10 text-primary-600 dark:text-primary-400">
                        {staff.employeeCode}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        {user?.name || 'Staff Member'}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">{staff.designation || 'Staff Operator'}</p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        staff.status === StaffStatus.ACTIVE
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-slate-500/10 text-slate-500'
                      }`}
                    >
                      {staff.status}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {user?.email || 'N/A'}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {user?.phone || 'N/A'}
                    </p>
                    <p className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      Branch: {branch?.name || activeBranch.name}
                    </p>
                    <p className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      {staff.employmentType?.replace('_', ' ')} · {staff.department || 'Operations'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewSummary(staff)}
                    className="text-xs flex items-center gap-1"
                  >
                    <Activity className="w-3.5 h-3.5 text-primary-500" />
                    Work Summary
                  </Button>

                  {staff.status === StaffStatus.ACTIVE && (
                    <button
                      onClick={() => handleDeactivate(staff.id || (staff as any)._id)}
                      className="text-xs text-rose-500 hover:underline font-medium"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Create Staff Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add Staff Member">
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Rahul Sharma" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address *</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="rahul@washora.com" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Role *</label>
              <select
                value={roleCode}
                onChange={(e) => setRoleCode(e.target.value as RoleType)}
                className="w-full text-sm px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white"
              >
                <option value={RoleType.OPERATOR}>Operator</option>
                <option value={RoleType.QC_INSPECTOR}>QC Inspector</option>
                <option value={RoleType.BRANCH_MANAGER}>Branch Manager</option>
                <option value={RoleType.CASHIER}>Cashier</option>
                <option value={RoleType.DELIVERY_AGENT}>Delivery Agent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Designation</label>
              <Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Senior Washing Specialist" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Employment Type</label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                className="w-full text-sm px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white"
              >
                <option value={EmploymentType.FULL_TIME}>Full Time</option>
                <option value={EmploymentType.PART_TIME}>Part Time</option>
                <option value={EmploymentType.CONTRACT}>Contract</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Base Monthly Salary (₹)</label>
            <Input type="number" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} placeholder="25000" />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Staff Member'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Work Summary Modal */}
      <Modal
        isOpen={!!selectedStaff}
        onClose={() => setSelectedStaff(null)}
        title={`Work Summary — ${workSummary?.name || selectedStaff?.employeeCode}`}
      >
        {loadingSummary ? (
          <div className="p-8 text-center text-slate-400">Loading operational summary...</div>
        ) : workSummary ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 font-medium">Jobs Assigned</p>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{workSummary.processingJobsAssigned}</h4>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                <p className="text-xs text-emerald-600 font-medium">Jobs Completed</p>
                <h4 className="text-lg font-bold text-emerald-600">{workSummary.processingJobsCompleted}</h4>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 font-medium">QC Checks Performed</p>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{workSummary.qcChecksCompleted}</h4>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800">
                <p className="text-xs text-rose-600 font-medium">QC Rejections</p>
                <h4 className="text-lg font-bold text-rose-600">{workSummary.qcFailures}</h4>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-[11px] text-slate-500 font-medium">Present Days</p>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">{workSummary.presentDays}</h4>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-[11px] text-slate-500 font-medium">Work Hours</p>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">{workSummary.totalWorkHours}h</h4>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-[11px] text-slate-500 font-medium">Overtime</p>
                <h4 className="text-base font-bold text-amber-600">{workSummary.overtimeHours}h</h4>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
