import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PayrollPeriodStatus } from '@washora/shared';

export type PayrollPeriodDocument = PayrollPeriod & Document;

@Schema({ timestamps: true, collection: 'payroll_periods' })
export class PayrollPeriod {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, trim: true }) // e.g. "October 2026"
  name: string;

  @Prop({ required: true, trim: true, index: true }) // YYYY-MM-DD
  startDate: string;

  @Prop({ required: true, trim: true, index: true }) // YYYY-MM-DD
  endDate: string;

  @Prop({
    type: String,
    enum: Object.values(PayrollPeriodStatus),
    default: PayrollPeriodStatus.DRAFT,
    index: true,
  })
  status: PayrollPeriodStatus;

  @Prop({ default: 0, min: 0 })
  totalGross: number; // in cents/paise

  @Prop({ default: 0, min: 0 })
  totalDeductions: number; // in cents/paise

  @Prop({ default: 0 })
  totalNet: number; // in cents/paise

  @Prop({ default: 0, min: 0 })
  totalStaffCount: number;

  @Prop()
  processedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  processedBy?: Types.ObjectId;

  @Prop()
  approvedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop()
  paidAt?: Date;
}

export const PayrollPeriodSchema = SchemaFactory.createForClass(PayrollPeriod);

PayrollPeriodSchema.index({ tenantId: 1, startDate: 1, endDate: 1 });
PayrollPeriodSchema.index({ tenantId: 1, status: 1 });
