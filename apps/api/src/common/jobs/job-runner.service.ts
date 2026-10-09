import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Job, JobExecutionResult, JobStatus } from './job.interface';
import { StructuredLoggerService } from '../logging/structured-logger.service';

export interface JobHandler<T = any> {
  (job: Job<T>): Promise<void>;
}

@Injectable()
export class JobRunnerService {
  private readonly logger = new StructuredLoggerService('JobRunner');
  private readonly handlers = new Map<string, JobHandler>();
  private readonly deadLetterJobs: Job[] = [];

  registerHandler<T = any>(jobType: string, handler: JobHandler<T>) {
    this.handlers.set(jobType, handler);
  }

  createJob<T = any>(
    jobType: string,
    payload: T,
    options: {
      tenantId?: string;
      maxAttempts?: number;
      correlationId?: string;
    } = {},
  ): Job<T> {
    return {
      jobId: randomUUID(),
      jobType,
      tenantId: options.tenantId,
      payload,
      createdAt: new Date(),
      attemptCount: 0,
      maxAttempts: options.maxAttempts || 3,
      status: 'QUEUED',
      correlationId: options.correlationId,
    };
  }

  async executeJob<T = any>(
    job: Job<T>,
    customHandler?: JobHandler<T>,
  ): Promise<JobExecutionResult> {
    const handler = customHandler || this.handlers.get(job.jobType);

    if (!handler) {
      const errorMsg = `No handler registered for job type: ${job.jobType}`;
      this.logger.error(errorMsg, { jobId: job.jobId, jobType: job.jobType });
      job.status = 'DEAD_LETTER';
      job.lastError = errorMsg;
      this.deadLetterJobs.push(job);
      return {
        success: false,
        jobId: job.jobId,
        attemptCount: job.attemptCount,
        status: 'DEAD_LETTER',
        error: errorMsg,
        isPermanentError: true,
      };
    }

    job.attemptCount += 1;
    job.status = 'PROCESSING';

    try {
      await handler(job);

      job.status = 'COMPLETED';
      job.completedAt = new Date();
      job.lastError = undefined;

      this.logger.info(`Job ${job.jobType} [${job.jobId}] completed successfully`, {
        jobId: job.jobId,
        jobType: job.jobType,
        attemptCount: job.attemptCount,
        tenantId: job.tenantId,
        correlationId: job.correlationId,
      });

      return {
        success: true,
        jobId: job.jobId,
        attemptCount: job.attemptCount,
        status: 'COMPLETED',
      };
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      job.lastError = errorMessage;

      // Classify error: permanent vs retryable
      const isPermanent =
        err?.name === 'ValidationError' ||
        err?.isPermanent === true ||
        job.attemptCount >= job.maxAttempts;

      if (isPermanent) {
        job.status = 'DEAD_LETTER';
        this.deadLetterJobs.push(job);
        this.logger.error(
          `Job ${job.jobType} [${job.jobId}] moved to DEAD_LETTER after ${job.attemptCount} attempts: ${errorMessage}`,
          {
            jobId: job.jobId,
            jobType: job.jobType,
            attemptCount: job.attemptCount,
            error: errorMessage,
            tenantId: job.tenantId,
          },
        );
      } else {
        job.status = 'FAILED';
        // Exponential backoff delay calculation: 2^attempt * 1000ms
        const backoffMs = Math.pow(2, job.attemptCount) * 1000;
        job.nextRetryAt = new Date(Date.now() + backoffMs);
        this.logger.warn(
          `Job ${job.jobType} [${job.jobId}] failed attempt ${job.attemptCount}/${job.maxAttempts}. Retry scheduled in ${backoffMs}ms: ${errorMessage}`,
          {
            jobId: job.jobId,
            jobType: job.jobType,
            attemptCount: job.attemptCount,
            nextRetryAt: job.nextRetryAt,
          },
        );
      }

      return {
        success: false,
        jobId: job.jobId,
        attemptCount: job.attemptCount,
        status: job.status,
        error: errorMessage,
        isPermanentError: isPermanent,
      };
    }
  }

  getDeadLetterJobs(): Job[] {
    return [...this.deadLetterJobs];
  }

  clearDeadLetterJobs() {
    this.deadLetterJobs.length = 0;
  }
}
