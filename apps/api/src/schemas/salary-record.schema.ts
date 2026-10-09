import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SalaryType } from '@washora/shared';

export type SalaryRecordDocument = SalaryRecord & Document;

@Schema({ timestamps: true, collection: 'salary_records' })
export class SalaryRecord {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'StaffProfile', required: true, index: true })
  staffId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(SalaryType),
    default: SalaryType.MONTHLY,
    required: true,
  })
  salaryType: SalaryType;

  @Prop({ required: true, min: 0 })
  baseSalary: number; // in cents/paise

  @Prop({ min: 0, default: 0 })
  hourlyRate?: number;

  @Prop({ min: 0, default: 0 })
  overtimeRate?: number; // per hour in cents/paise

  @Prop({ type: [{ name: { type: String, trim: true }, amount: { type: Number, min: 0 } }], default: [] })
  allowances: { name: string; amount: number }[];

  @Prop({ type: [{ name: { type: String, trim: true }, amount: { type: Number, min: 0 } }], default: [] })
  deductions: { name: string; amount: number }[];

  @Prop({ type: Date, required: true, default: Date.now })
  effectiveFrom: Date;

  @Prop({ type: Date })
  effectiveTo?: Date;

  @Prop({ default: true, index: true })
  isCurrent: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;
}

export const SalaryRecordSchema = SchemaFactory.createForClass(SalaryRecord);

SalaryRecordSchema.index({ tenantId: 1, staffId: 1, effectiveFrom: -1 });
SalaryRecordSchema.index({ tenantId: 1, staffId: 1, isCurrent: 1 });
