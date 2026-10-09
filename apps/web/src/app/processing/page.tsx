'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  processingApi,
  ProcessingQueueResponse,
} from '@/lib/api/processing';
import {
  ProcessingPriority,
  QCResult,
  QCIssueType,
  ProcessingJobStatus,
  OrderStatus,
} from '@washora/shared';
import {
  Sparkles,
  Shirt,
  CheckCircle2,
  Clock,
  QrCode,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  X,
  Plus,
} from 'lucide-react';
import { formatTime, formatDate } from '@/lib/utils';

export default function ProcessingPage() {
  const { activeBranch, showNotification } = useApp();

  // Data state
  const [queueData, setQueueData] = useState<ProcessingQueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedStageCode, setSelectedStageCode] = useState<string>('ALL');

  // Modals state
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [qcModalJob, setQcModalJob] = useState<any | null>(null);
  const [qcResult, setQcResult] = useState<QCResult>(QCResult.PASSED);
  const [qcIssues, setQcIssues] = useState<QCIssueType[]>([]);
  const [qcNotes, setQcNotes] = useState('');
  const [qcReworkStage, setQcReworkStage] = useState('WASHING');
  const [isQcSubmitting, setIsQcSubmitting] = useState(false);

  // Issue modal state
  const [issueModalJob, setIssueModalJob] = useState<any | null>(null);
  const [issueType, setIssueType] = useState('STAIN_NOT_REMOVED');
  const [issueSeverity, setIssueSeverity] = useState('MEDIUM');
  const [issueDescription, setIssueDescription] = useState('');
  const [isIssueSubmitting, setIsIssueSubmitting] = useState(false);

  // Assign modal state
  const [assignModalJob, setAssignModalJob] = useState<any | null>(null);
  const [assignedUserId, setAssignedUserId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [isAssignSubmitting, setIsAssignSubmitting] = useState(false);

  // Timeline modal state
  const [timelineJob, setTimelineJob] = useState<any | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Fetch Queue Data
  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const data = await processingApi.getQueue({
        branchId: activeBranch?.id,
        priority: selectedPriority !== 'ALL' ? selectedPriority : undefined,
        stageCode: selectedStageCode !== 'ALL' ? selectedStageCode : undefined,
        search: searchQuery || undefined,
        limit: 100,
      });
      setQueueData(data);
    } catch (err) {
      console.warn('Could not fetch processing queue from API, falling back to local view');
    } finally {
      setLoading(false);
    }
  }, [activeBranch?.id, selectedPriority, selectedStageCode, searchQuery]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Stage transition
  const handleMoveStage = async (job: any, targetStageCode: string) => {
    try {
      await processingApi.updateStage(job.jobId || job.id, {
        stageCode: targetStageCode,
        notes: `Advanced to ${targetStageCode}`,
      });
      showNotification(`Garment ${job.garmentNumber} moved to ${targetStageCode}`, 'success');
      fetchQueue();
    } catch (err: any) {
      showNotification(err.message || 'Could not move stage', 'error');
    }
  };

  // Submit QC
  const handleSubmitQC = async () => {
    if (!qcModalJob) return;
    setIsQcSubmitting(true);
    try {
      await processingApi.submitQC(qcModalJob.jobId || qcModalJob.id, {
        result: qcResult,
        issues: qcResult !== QCResult.PASSED ? qcIssues : [],
        notes: qcNotes,
        reworkStageCode: qcResult === QCResult.REWORK_REQUIRED ? qcReworkStage : undefined,
      });

      showNotification(
        `Garment ${qcModalJob.garmentNumber}: ${qcResult === QCResult.PASSED ? 'QC Passed & Ready' : `QC ${qcResult}`}`,
        qcResult === QCResult.PASSED ? 'success' : 'warning',
      );

      setQcModalJob(null);
      setQcNotes('');
      setQcIssues([]);
      fetchQueue();
    } catch (err: any) {
      showNotification(err.message || 'Error submitting QC', 'error');
    } finally {
      setIsQcSubmitting(false);
    }
  };

  // Submit Issue
  const handleSubmitIssue = async () => {
    if (!issueModalJob) return;
    setIsIssueSubmitting(true);
    try {
      await processingApi.createIssue(issueModalJob.jobId || issueModalJob.id, {
        type: issueType,
        severity: issueSeverity,
        description: issueDescription,
      });

      showNotification(`Defect recorded for ${issueModalJob.garmentNumber}`, 'warning');

      setIssueModalJob(null);
      setIssueDescription('');
      fetchQueue();
    } catch (err: any) {
      showNotification(err.message || 'Error saving issue', 'error');
    } finally {
      setIsIssueSubmitting(false);
    }
  };

  // Open Timeline
  const openTimeline = async (job: any) => {
    setTimelineJob(job);
    setLoadingTimeline(true);
    try {
      const res = await processingApi.getJobTimeline(job.jobId || job.id);
      setTimelineEvents(Array.isArray(res) ? res : (res as any)?.data || []);
    } catch (err) {
      setTimelineEvents([]);
    } finally {
      setLoadingTimeline(false);
    }
  };

  // Group items by stage for Kanban
  const stages = queueData?.stages || [
    { id: '1', code: 'RECEIVED', name: 'Intake / Sorting', sequence: 1, color: '#6366f1', icon: 'Inbox', count: 0 },
    { id: '2', code: 'WASHING', name: 'Washing / Solvent', sequence: 2, color: '#0ea5e9', icon: 'Droplets', count: 0 },
    { id: '3', code: 'DRYING', name: 'Drying / Tumbling', sequence: 3, color: '#f59e0b', icon: 'Sun', count: 0 },
    { id: '4', code: 'IRONING', name: 'Iron & Steam Press', sequence: 4, color: '#ec4899', icon: 'Flame', count: 0 },
    { id: '5', code: 'QUALITY_CHECK', name: 'QC Station', sequence: 5, color: '#e11d48', icon: 'CheckCircle2', count: 0 },
    { id: '6', code: 'READY', name: 'Ready on Shelf', sequence: 6, color: '#059669', icon: 'PackageCheck', count: 0 },
  ];

  const itemsByStage: Record<string, any[]> = {};
  for (const s of stages) {
    itemsByStage[s.code] = [];
  }

  if (queueData?.items) {
    for (const item of queueData.items) {
      const code = item.stageCode || 'RECEIVED';
      if (!itemsByStage[code]) {
        itemsByStage[code] = [];
      }
      itemsByStage[code].push(item);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            Plant Processing & QC Station
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time multi-stage garment processing workflow for{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {activeBranch?.name || 'All Branches'}
            </span>
          </p>
        </div>

        {/* Quick Stats Pills */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Total Active:{' '}
            <span className="font-bold text-primary-600 dark:text-primary-400">
              {queueData?.metrics?.totalActiveJobs ?? 0}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40">
            Urgent:{' '}
            <span className="font-bold">
              {queueData?.metrics?.urgentJobsCount ?? 0}
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchQueue}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <GlassCard className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by garment barcode, order number, customer name..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mr-1">
            <Filter className="w-3.5 h-3.5" /> Priority:
          </div>
          {['ALL', 'NORMAL', 'HIGH', 'URGENT'].map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPriority(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedPriority === p
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const items = itemsByStage[stage.code] || [];
          return (
            <div key={stage.code} className="flex flex-col min-w-[260px] space-y-3">
              {/* Column Header */}
              <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: stage.color || '#6366f1' }}
                  />
                  <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider truncate">
                    {stage.name}
                  </h2>
                </div>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  {items.length}
                </span>
              </div>

              {/* Garment Cards Container */}
              <div className="space-y-3 min-h-[400px]">
                {items.map((job) => {
                  const isUrgent = job.priority === ProcessingPriority.HIGH || job.priority === ProcessingPriority.URGENT;
                  return (
                    <div
                      key={job.id || job.jobId}
                      className={`p-3.5 rounded-xl bg-white dark:bg-slate-900 border transition-all hover:shadow-md space-y-2.5 ${
                        isUrgent
                          ? 'border-amber-400 dark:border-amber-600/70 shadow-amber-500/5'
                          : 'border-slate-200/80 dark:border-slate-800 shadow-sm'
                      }`}
                    >
                      {/* Top row: Barcode / Order / Priority */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-extrabold text-primary-600 dark:text-primary-400">
                          {job.garmentNumber || job.barcode || 'WS-G-000000'}
                        </span>
                        {isUrgent && (
                          <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 px-1.5 py-0.5 rounded font-bold animate-pulse">
                            {job.priority} ⚡
                          </span>
                        )}
                      </div>

                      {/* Item Details */}
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {job.productName}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {job.customerName} · Order #{job.orderNumber}
                        </p>
                      </div>

                      {/* Tag Attributes */}
                      <div className="flex flex-wrap gap-1 text-[10px]">
                        {job.garmentColor && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                            {job.garmentColor}
                          </span>
                        )}
                        {job.serviceName && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-medium">
                            {job.serviceName}
                          </span>
                        )}
                      </div>

                      {/* Defects or Special Notes */}
                      {job.specialInstructions && (
                        <p className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 p-1.5 rounded-lg border border-amber-200/40">
                          ⚠️ {job.specialInstructions}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1.5">
                        <button
                          onClick={() => openTimeline(job)}
                          className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          Timeline
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setIssueModalJob(job)}
                            className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            title="Report Issue / Defect"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>

                          {stage.code === 'QUALITY_CHECK' ? (
                            <Button
                              variant="primary"
                              size="xs"
                              className="font-bold text-[11px] bg-emerald-600 hover:bg-emerald-700"
                              leftIcon={<ShieldCheck className="w-3 h-3" />}
                              onClick={() => setQcModalJob(job)}
                            >
                              QC Check
                            </Button>
                          ) : stage.code !== 'READY' ? (
                            <Button
                              variant="secondary"
                              size="xs"
                              className="font-bold text-[11px] text-primary-600 dark:text-primary-400"
                              rightIcon={<ArrowRight className="w-3 h-3" />}
                              onClick={() => {
                                // Next stage in sequence
                                const currIdx = stages.findIndex((s) => s.code === stage.code);
                                const nextStage = stages[currIdx + 1];
                                if (nextStage) {
                                  handleMoveStage(job, nextStage.code);
                                }
                              }}
                            >
                              Advance
                            </Button>
                          ) : (
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {items.length === 0 && (
                  <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                    No garments
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* QC Modal */}
      {qcModalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <GlassCard className="max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  QC Inspection: {qcModalJob.garmentNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  {qcModalJob.productName} · Order #{qcModalJob.orderNumber}
                </p>
              </div>
              <button
                onClick={() => setQcModalJob(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QC Result Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Inspection Result
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { res: QCResult.PASSED, label: 'Pass & Ready', color: 'bg-emerald-600 text-white' },
                  { res: QCResult.REWORK_REQUIRED, label: 'Rework Req.', color: 'bg-amber-600 text-white' },
                  { res: QCResult.FAILED, label: 'Fail / Reject', color: 'bg-rose-600 text-white' },
                ].map((item) => (
                  <button
                    key={item.res}
                    type="button"
                    onClick={() => setQcResult(item.res)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all text-center ${
                      qcResult === item.res
                        ? item.color
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rework Stage Selector if Rework Required */}
            {qcResult === QCResult.REWORK_REQUIRED && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Route back to Stage for Rework
                </label>
                <select
                  value={qcReworkStage}
                  onChange={(e) => setQcReworkStage(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
                >
                  <option value="WASHING">Washing / Re-wash</option>
                  <option value="IRONING">Ironing & Steam Pressing</option>
                  <option value="SORTING">Sorting & Stain Spotting</option>
                  <option value="FINISHING">Finishing & Lint Removal</option>
                </select>
              </div>
            )}

            {/* Issues Checkbox List if Not Passed */}
            {qcResult !== QCResult.PASSED && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Defects / Issues Detected
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-slate-800">
                  {Object.values(QCIssueType).map((issue) => (
                    <label
                      key={issue}
                      className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={qcIssues.includes(issue)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setQcIssues([...qcIssues, issue]);
                          } else {
                            setQcIssues(qcIssues.filter((i) => i !== issue));
                          }
                        }}
                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                      {issue.replace('_', ' ')}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Inspection Notes
              </label>
              <textarea
                rows={2}
                placeholder="Details of inspection..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-primary-500"
                value={qcNotes}
                onChange={(e) => setQcNotes(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setQcModalJob(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isQcSubmitting}
                onClick={handleSubmitQC}
              >
                Submit Inspection
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Report Defect / Issue Modal */}
      {issueModalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <GlassCard className="max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Report Defect: {issueModalJob.garmentNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  {issueModalJob.productName} · Order #{issueModalJob.orderNumber}
                </p>
              </div>
              <button
                onClick={() => setIssueModalJob(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Issue Type
                </label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
                >
                  <option value="STAIN_NOT_REMOVED">Stain Not Removed</option>
                  <option value="GARMENT_DAMAGED">Garment Damaged</option>
                  <option value="BUTTON_MISSING">Button Missing</option>
                  <option value="COLOR_BLEEDING">Color Bleeding</option>
                  <option value="MACHINE_MALFUNCTION">Machine Malfunction</option>
                  <option value="WRONG_ITEM">Wrong Item / Misplaced</option>
                  <option value="OTHER">Other Issue</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Severity
                </label>
                <select
                  value={issueSeverity}
                  onChange={(e) => setIssueSeverity(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
                >
                  <option value="LOW">Low - Minor cosmetic issue</option>
                  <option value="MEDIUM">Medium - Requires second wash/treatment</option>
                  <option value="HIGH">High - Risk of damage or delay</option>
                  <option value="CRITICAL">Critical - Immediate manager intervention</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the problem in detail..."
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-primary-500"
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIssueModalJob(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isIssueSubmitting}
                disabled={!issueDescription.trim()}
                onClick={handleSubmitIssue}
              >
                Log Issue
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Timeline Modal */}
      {timelineJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <GlassCard className="max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary-600" />
                  Garment Processing Timeline: {timelineJob.garmentNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  {timelineJob.productName} · Order #{timelineJob.orderNumber}
                </p>
              </div>
              <button
                onClick={() => setTimelineJob(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 space-y-4">
              {loadingTimeline && (
                <div className="py-12 text-center text-xs text-slate-400">
                  Loading timeline events...
                </div>
              )}

              {!loadingTimeline && timelineEvents.length === 0 && (
                <div className="py-12 text-center text-xs text-slate-400">
                  No timeline records found.
                </div>
              )}

              {!loadingTimeline &&
                timelineEvents.map((evt, idx) => (
                  <div key={evt.id || idx} className="flex gap-3 relative">
                    {/* Stepper Dot & Line */}
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary-600 dark:bg-primary-400 mt-1 shadow-xs" />
                      {idx < timelineEvents.length - 1 && (
                        <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-800 my-1" />
                      )}
                    </div>

                    <div className="pb-3 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {evt.action?.replace('_', ' ')} {evt.toStage ? `→ ${evt.toStage}` : ''}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatTime(evt.timestamp)}
                        </span>
                      </div>
                      {evt.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                          {evt.notes}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">
                        By {evt.actorName || 'System'} · {formatDate(evt.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-right">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setTimelineJob(null)}
              >
                Close
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
