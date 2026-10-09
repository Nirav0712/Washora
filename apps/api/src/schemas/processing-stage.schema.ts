import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProcessingStageDocument = ProcessingStage & Document;

@Schema({ timestamps: true, collection: 'processing_stages' })
export class ProcessingStage {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch' })
  branchId?: Types.ObjectId;

  @Prop({ required: true, trim: true, uppercase: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, default: 1, min: 1 })
  sequence: number;

  @Prop({ default: '#6366f1' })
  color: string;

  @Prop({ default: 'Inbox' })
  icon: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const ProcessingStageSchema = SchemaFactory.createForClass(ProcessingStage);

// Compound Indexes
ProcessingStageSchema.index({ tenantId: 1, code: 1, branchId: 1 }, { unique: true });
ProcessingStageSchema.index({ tenantId: 1, sequence: 1 });
ProcessingStageSchema.index({ tenantId: 1, isActive: 1, isDeleted: 1 });
