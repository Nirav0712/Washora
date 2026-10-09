import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SalaryAdvanceStatus } from '@washora/shared';

export type SalaryAdvanceDocument = SalaryAdvance & Document;

@Schema({ timestamps: true, collection: 'salary_advances' })
export class SalaryAdvance {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'StaffProfile', required: true, index: true })
  staffId: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  amount: number; // in cents/paise

  @Prop({ required: true, trim: true, index: true }) // YYYY-MM-DD
  requestedDate: string;

  @Prop()
  approvedDate?: Date;

  @Prop({ required: true, trim: true })
  reason: string;

  @Prop({
    type: String,
    enum: Object.values(SalaryAdvanceStatus),
    default: SalaryAdvanceStatus.PENDING,
    index: true,
  })
  status: SalaryAdvanceStatus;

  @Prop({ type: Types.ObjectId, ref: 'PayrollPeriod', index: true })
  deductFromPayrollPeriodId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop({ trim: true })
  rejectionReason?: string;
}

export const SalaryAdvanceSchema = SchemaFactory.createForClass(SalaryAdvance);

SalaryAdvanceSchema.index({ tenantId: 1, staffId: 1, status: 1 });
SalaryAdvanceSchema.index({ tenantId: 1, deductFromPayrollPeriodId: 1 });
