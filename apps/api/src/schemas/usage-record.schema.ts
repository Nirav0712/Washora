import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UsageRecordDocument = UsageRecord & Document;

@Schema({ timestamps: true, collection: 'usage_records' })
export class UsageRecord {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true }) // e.g. '2026-10'
  period: string;

  @Prop({ required: true }) // e.g. 'CUSTOMERS', 'ORDERS', 'WHATSAPP_MESSAGES'
  metric: string;

  @Prop({ default: 0 })
  value: number;
}

export const UsageRecordSchema = SchemaFactory.createForClass(UsageRecord);
UsageRecordSchema.index({ tenantId: 1, period: 1, metric: 1 }, { unique: true });
