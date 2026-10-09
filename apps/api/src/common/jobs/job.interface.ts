export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'DEAD_LETTER';

export interface Job<T = any> {
  jobId: string;
  jobType: string;
  tenantId?: string;
  payload: T;
  createdAt: Date;
  attemptCount: number;
  maxAttempts: number;
  status: JobStatus;
  correlationId?: string;
  lastError?: string;
  nextRetryAt?: Date;
  completedAt?: Date;
}

export interface JobExecutionResult {
  success: boolean;
  jobId: string;
  attemptCount: number;
  status: JobStatus;
  error?: string;
  isPermanentError?: boolean;
}
