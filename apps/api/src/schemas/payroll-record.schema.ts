import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SalaryType, PayrollPeriodStatus } from '@washora/shared';

export type PayrollRecordDocument = PayrollRecord & Document;

@Schema({ timestamps: true, collection: 'payroll_records' })
export class PayrollRecord {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true, index: true })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PayrollPeriod', required: true, index: true })
  payrollPeriodId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'StaffProfile', required: true, index: true })
  staffId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(SalaryType),
    required: true,
  })
  salaryType: SalaryType;

  @Prop({ required: true, min: 0 })
  baseSalary: number; // in cents/paise snapshot

  @Prop({ default: 0, min: 0 })
  workingDays: number;

  @Prop({ default: 0, min: 0 })
  presentDays: number;

  @Prop({ default: 0, min: 0 })
  leaveDays: number;

  @Prop({ default: 0, min: 0 })
  absentDays: number;

  @Prop({ default: 0, min: 0 })
  regularHours: number;

  @Prop({ default: 0, min: 0 })
  overtimeHours: number;

  @Prop({ default: 0, min: 0 })
  overtimeAmount: number; // in cents/paise

  @Prop({ type: [{ name: { type: String, trim: true }, amount: { type: Number, min: 0 } }], default: [] })
  allowances: { name: string; amount: number }[];

  @Prop({ default: 0, min: 0 })
  totalAllowances: number; // in cents/paise

  @Prop({ type: [{ name: { type: String, trim: true }, amount: { type: Number, min: 0 } }], default: [] })
  deductions: { name: string; amount: number }[];

  @Prop({ default: 0, min: 0 })
  totalDeductions: number; // in cents/paise

  @Prop({ required: true, min: 0 })
  grossSalary: number; // in cents/paise

  @Prop({ default: 0, min: 0 })
  advanceAmount: number; // in cents/paise

  @Prop({ required: true })
  netSalary: number; // in cents/paise

  @Prop({
    type: String,
    enum: Object.values(PayrollPeriodStatus),
    default: PayrollPeriodStatus.PROCESSED,
    index: true,
  })
  status: PayrollPeriodStatus;

  @Prop()
  paidAt?: Date;

  @Prop({ trim: true })
  paymentMethod?: string;

  @Prop({ trim: true })
  paymentReference?: string;
}

export const PayrollRecordSchema = SchemaFactory.createForClass(PayrollRecord);

PayrollRecordSchema.index({ tenantId: 1, payrollPeriodId: 1 });
PayrollRecordSchema.index({ tenantId: 1, staffId: 1 });
PayrollRecordSchema.index({ tenantId: 1, payrollPeriodId: 1, staffId: 1 }, { unique: true });
PayrollRecordSchema.index({ tenantId: 1, branchId: 1 });
