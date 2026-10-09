import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { QCResult, QCIssueType } from '@washora/shared';

export type QualityCheckDocument = QualityCheck & Document;

@Schema({ timestamps: true, collection: 'quality_checks' })
export class QualityCheck {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true, index: true })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProcessingJob', required: true, index: true })
  processingJobId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Garment', required: true, index: true })
  garmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  inspectorUserId: Types.ObjectId;

  @Prop({ trim: true })
  inspectorName?: string;

  @Prop({
    type: String,
    enum: Object.values(QCResult),
    required: true,
    index: true,
  })
  result: QCResult;

  @Prop({
    type: [String],
    enum: Object.values(QCIssueType),
    default: [],
  })
  issues: QCIssueType[];

  @Prop({ trim: true })
  notes?: string;

  @Prop({ default: false })
  isOverride: boolean;

  @Prop({ trim: true })
  overrideReason?: string;

  @Prop({ default: Date.now, index: true })
  checkedAt: Date;
}

export const QualityCheckSchema = SchemaFactory.createForClass(QualityCheck);

// Indexes
QualityCheckSchema.index({ tenantId: 1, garmentId: 1 });
QualityCheckSchema.index({ tenantId: 1, orderId: 1 });
QualityCheckSchema.index({ tenantId: 1, result: 1 });
QualityCheckSchema.index({ tenantId: 1, checkedAt: -1 });
QualityCheckSchema.index({ tenantId: 1, branchId: 1, checkedAt: -1 });
