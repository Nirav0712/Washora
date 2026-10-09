import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ProcessingJobStatus, ProcessingPriority } from '@washora/shared';

export type ProcessingJobDocument = ProcessingJob & Document;

@Schema({ timestamps: true, collection: 'processing_jobs' })
export class ProcessingJob {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true, index: true })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Garment', required: true, index: true })
  garmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProcessingStage', index: true })
  currentStageId?: Types.ObjectId;

  @Prop({ required: true, trim: true, uppercase: true, default: 'RECEIVED' })
  stageCode: string;

  @Prop({ trim: true, default: 'Received' })
  stageName: string;

  @Prop({
    type: String,
    enum: Object.values(ProcessingJobStatus),
    default: ProcessingJobStatus.QUEUED,
    index: true,
  })
  status: ProcessingJobStatus;

  @Prop({
    type: String,
    enum: Object.values(ProcessingPriority),
    default: ProcessingPriority.NORMAL,
    index: true,
  })
  priority: ProcessingPriority;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  assignedUserId?: Types.ObjectId;

  @Prop()
  startedAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  expectedCompletionAt?: Date;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}

export const ProcessingJobSchema = SchemaFactory.createForClass(ProcessingJob);

// Compound Indexes for High-Performance Queries & Isolation
ProcessingJobSchema.index({ tenantId: 1, branchId: 1, status: 1 });
ProcessingJobSchema.index({ tenantId: 1, branchId: 1, currentStageId: 1 });
ProcessingJobSchema.index({ tenantId: 1, garmentId: 1 }, { unique: true });
ProcessingJobSchema.index({ tenantId: 1, orderId: 1 });
ProcessingJobSchema.index({ tenantId: 1, assignedUserId: 1 });
ProcessingJobSchema.index({ tenantId: 1, priority: 1 });
ProcessingJobSchema.index({ tenantId: 1, createdAt: -1 });
