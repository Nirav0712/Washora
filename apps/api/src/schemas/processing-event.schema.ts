import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ProcessingAction } from '@washora/shared';

export type ProcessingEventDocument = ProcessingEvent & Document;

@Schema({ timestamps: true, collection: 'processing_events' })
export class ProcessingEvent {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true, index: true })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProcessingJob', required: true, index: true })
  processingJobId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Garment', required: true, index: true })
  garmentId: Types.ObjectId;

  @Prop({ trim: true, uppercase: true })
  fromStage?: string;

  @Prop({ trim: true, uppercase: true })
  toStage?: string;

  @Prop({
    type: String,
    enum: Object.values(ProcessingAction),
    required: true,
    index: true,
  })
  action: ProcessingAction;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  actorUserId?: Types.ObjectId;

  @Prop({ trim: true })
  actorName?: string;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ default: Date.now, index: true })
  timestamp: Date;
}

export const ProcessingEventSchema = SchemaFactory.createForClass(ProcessingEvent);

// High performance timeline & audit indexes
ProcessingEventSchema.index({ tenantId: 1, garmentId: 1, timestamp: -1 });
ProcessingEventSchema.index({ tenantId: 1, orderId: 1, timestamp: -1 });
ProcessingEventSchema.index({ tenantId: 1, processingJobId: 1, timestamp: -1 });
ProcessingEventSchema.index({ tenantId: 1, branchId: 1, timestamp: -1 });
