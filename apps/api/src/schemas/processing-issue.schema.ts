import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ProcessingIssueSeverity, ProcessingIssueStatus } from '@washora/shared';

export type ProcessingIssueDocument = ProcessingIssue & Document;

@Schema({ timestamps: true, collection: 'processing_issues' })
export class ProcessingIssue {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true, index: true })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Garment', required: true, index: true })
  garmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProcessingJob', required: true, index: true })
  processingJobId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  type: string;

  @Prop({
    type: String,
    enum: Object.values(ProcessingIssueSeverity),
    default: ProcessingIssueSeverity.MEDIUM,
    index: true,
  })
  severity: ProcessingIssueSeverity;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reportedBy: Types.ObjectId;

  @Prop({ trim: true })
  reportedByName?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  resolvedBy?: Types.ObjectId;

  @Prop({ trim: true })
  resolvedByName?: string;

  @Prop({ trim: true })
  resolutionNotes?: string;

  @Prop({
    type: String,
    enum: Object.values(ProcessingIssueStatus),
    default: ProcessingIssueStatus.OPEN,
    index: true,
  })
  status: ProcessingIssueStatus;

  @Prop()
  resolvedAt?: Date;
}

export const ProcessingIssueSchema = SchemaFactory.createForClass(ProcessingIssue);

// Indexes
ProcessingIssueSchema.index({ tenantId: 1, garmentId: 1 });
ProcessingIssueSchema.index({ tenantId: 1, processingJobId: 1 });
ProcessingIssueSchema.index({ tenantId: 1, branchId: 1, status: 1 });
ProcessingIssueSchema.index({ tenantId: 1, status: 1 });
ProcessingIssueSchema.index({ tenantId: 1, createdAt: -1 });
