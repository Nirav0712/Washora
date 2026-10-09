import { Global, Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { StructuredLoggerService } from './logging/structured-logger.service';
import { RateLimiterGuard } from './guards/rate-limiter.guard';
import { JobRunnerService } from './jobs/job-runner.service';
import { WebhookVerifierService } from './services/webhook-verifier.service';
import { CounterModule } from './services/counter.module';

@Global()
@Module({
  imports: [CounterModule],
  providers: [
    Reflector,
    StructuredLoggerService,
    RateLimiterGuard,
    JobRunnerService,
    WebhookVerifierService,
  ],
  exports: [
    Reflector,
    StructuredLoggerService,
    RateLimiterGuard,
    JobRunnerService,
    WebhookVerifierService,
    CounterModule,
  ],
})
export class CommonInfrastructureModule {}
