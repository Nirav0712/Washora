import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ProcessingStage,
  ProcessingStageSchema,
} from '../../schemas/processing-stage.schema';
import {
  ProcessingJob,
  ProcessingJobSchema,
} from '../../schemas/processing-job.schema';
import {
  ProcessingEvent,
  ProcessingEventSchema,
} from '../../schemas/processing-event.schema';
import {
  QualityCheck,
  QualityCheckSchema,
} from '../../schemas/quality-check.schema';
import {
  ProcessingIssue,
  ProcessingIssueSchema,
} from '../../schemas/processing-issue.schema';
import { Garment, GarmentSchema } from '../../schemas/garment.schema';
import { Order, OrderSchema } from '../../schemas/order.schema';
import { Membership, MembershipSchema } from '../../schemas/membership.schema';
import { Branch, BranchSchema } from '../../schemas/branch.schema';
import { ProcessingStageService } from './processing-stage.service';
import { OrderProcessingSyncService } from './order-processing-sync.service';
import { ProcessingQueueService } from './processing-queue.service';
import { QCService } from './qc.service';
import { ProcessingService } from './processing.service';
import { ProcessingController } from './processing.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProcessingStage.name, schema: ProcessingStageSchema },
      { name: ProcessingJob.name, schema: ProcessingJobSchema },
      { name: ProcessingEvent.name, schema: ProcessingEventSchema },
      { name: QualityCheck.name, schema: QualityCheckSchema },
      { name: ProcessingIssue.name, schema: ProcessingIssueSchema },
      { name: Garment.name, schema: GarmentSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Membership.name, schema: MembershipSchema },
      { name: Branch.name, schema: BranchSchema },
    ]),
    AuditModule,
  ],
  controllers: [ProcessingController],
  providers: [
    ProcessingStageService,
    OrderProcessingSyncService,
    ProcessingQueueService,
    QCService,
    ProcessingService,
  ],
  exports: [
    ProcessingService,
    ProcessingStageService,
    ProcessingQueueService,
    QCService,
    OrderProcessingSyncService,
  ],
})
export class ProcessingModule {}
