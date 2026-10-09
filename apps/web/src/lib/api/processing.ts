import { apiClient } from './client';
import {
  ProcessingJob,
  ProcessingStageConfig,
  ProcessingEvent,
  QualityCheck,
  ProcessingIssue,
  ProcessingPriority,
  QCResult,
  QCIssueType,
} from '@washora/shared';

export interface ProcessingQueueResponse {
  items: Array<
    ProcessingJob & {
      jobId: string;
      orderNumber: string;
      garmentNumber: string;
      barcode?: string;
      productName?: string;
      serviceName?: string;
      garmentColor?: string;
      garmentBrand?: string;
      condition?: string;
      stainsNoted?: string[];
      damagesNoted?: string[];
      specialInstructions?: string;
      customerName?: string;
      customerPhone?: string;
      branchName?: string;
    }
  >;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stages: Array<{
    id: string;
    code: string;
    name: string;
    sequence: number;
    color: string;
    icon: string;
    count: number;
  }>;
  metrics: {
    totalActiveJobs: number;
    urgentJobsCount: number;
    unassignedJobsCount: number;
  };
}

export const processingApi = {
  getQueue: (params?: {
    branchId?: string;
    stageCode?: string;
    status?: string;
    priority?: string;
    assignedUserId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    return apiClient.get<ProcessingQueueResponse>('/processing/queue', { params });
  },

  getJobs: (params?: Record<string, any>) => {
    return apiClient.get<ProcessingJob[]>('/processing/jobs', { params });
  },

  getJob: (id: string) => {
    return apiClient.get<ProcessingJob>(`/processing/jobs/${id}`);
  },

  createJob: (payload: {
    orderId: string;
    garmentId: string;
    branchId?: string;
    priority?: ProcessingPriority;
    assignedUserId?: string;
    notes?: string;
  }) => {
    return apiClient.post<ProcessingJob>('/processing/jobs', payload);
  },

  updateStage: (
    id: string,
    payload: {
      stageCode: string;
      notes?: string;
      isOverride?: boolean;
      overrideReason?: string;
    },
  ) => {
    return apiClient.patch<ProcessingJob>(`/processing/jobs/${id}/stage`, payload);
  },

  assignJob: (
    id: string,
    payload: {
      assignedUserId?: string;
      notes?: string;
    },
  ) => {
    return apiClient.patch<ProcessingJob>(`/processing/jobs/${id}/assign`, payload);
  },

  updatePriority: (
    id: string,
    payload: {
      priority: ProcessingPriority;
      reason?: string;
    },
  ) => {
    return apiClient.patch<ProcessingJob>(`/processing/jobs/${id}/priority`, payload);
  },

  getJobTimeline: (id: string) => {
    return apiClient.get<ProcessingEvent[]>(`/processing/jobs/${id}/timeline`);
  },

  getGarmentTimeline: (id: string) => {
    return apiClient.get<ProcessingEvent[]>(`/processing/garments/${id}/timeline`);
  },

  // QC
  submitQC: (
    id: string,
    payload: {
      result: QCResult;
      issues?: QCIssueType[];
      notes?: string;
      isOverride?: boolean;
      overrideReason?: string;
      reworkStageCode?: string;
    },
  ) => {
    return apiClient.post<QualityCheck>(`/processing/jobs/${id}/qc`, payload);
  },

  getJobQC: (id: string) => {
    return apiClient.get<QualityCheck[]>(`/processing/jobs/${id}/qc`);
  },

  // Issues
  createIssue: (
    id: string,
    payload: {
      type: string;
      severity?: string;
      description: string;
    },
  ) => {
    return apiClient.post<ProcessingIssue>(`/processing/jobs/${id}/issues`, payload);
  },

  getJobIssues: (id: string) => {
    return apiClient.get<ProcessingIssue[]>(`/processing/jobs/${id}/issues`);
  },

  resolveIssue: (
    issueId: string,
    payload: {
      resolutionNotes: string;
    },
  ) => {
    return apiClient.patch<ProcessingIssue>(`/processing/issues/${issueId}`, payload);
  },

  // Stages
  getStages: (branchId?: string) => {
    return apiClient.get<ProcessingStageConfig[]>('/processing/stages', {
      params: branchId ? { branchId } : undefined,
    });
  },

  createStage: (payload: Partial<ProcessingStageConfig>) => {
    return apiClient.post<ProcessingStageConfig>('/processing/stages', payload);
  },

  updateStageConfig: (id: string, payload: Partial<ProcessingStageConfig>) => {
    return apiClient.patch<ProcessingStageConfig>(`/processing/stages/${id}`, payload);
  },

  deleteStage: (id: string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/processing/stages/${id}`);
  },
};
