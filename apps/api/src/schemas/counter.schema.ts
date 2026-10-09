import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CounterDocument = Counter & Document;

@Schema({ timestamps: true, collection: 'counters' })
export class Counter {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  sequenceName: string; // 'ORDER', 'CUSTOMER', 'GARMENT', 'PAYMENT'

  @Prop({ default: 0 })
  seq: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);

CounterSchema.index({ tenantId: 1, sequenceName: 1 }, { unique: true });
