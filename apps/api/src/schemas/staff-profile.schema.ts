import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EmploymentType, StaffStatus, SalaryType } from '@washora/shared';

export type StaffProfileDocument = StaffProfile & Document;

@Schema({ _id: false })
export class BankDetailsSchema {
  @Prop({ trim: true })
  accountNumber?: string;

  @Prop({ trim: true })
  accountNumberMasked?: string;

  @Prop({ trim: true, uppercase: true })
  ifscCode?: string;

  @Prop({ trim: true })
  bankName?: string;

  @Prop({ trim: true })
  accountHolderName?: string;

  @Prop({ trim: true })
  upiId?: string;
}

@Schema({ _id: false })
export class EmergencyContactSchema {
  @Prop({ trim: true, required: true })
  name: string;

  @Prop({ trim: true, required: true })
  relationship: string;

  @Prop({ trim: true, required: true })
  phone: string;
}

@Schema({ _id: false })
export class AddressSchema {
  @Prop({ trim: true })
  street?: string;

  @Prop({ trim: true })
  city?: string;

  @Prop({ trim: true })
  state?: string;

  @Prop({ trim: true })
  country?: string;

  @Prop({ trim: true })
  pincode?: string;
}

@Schema({ _id: false })
export class SalaryConfigurationSchema {
  @Prop({ type: String, enum: Object.values(SalaryType), required: true })
  salaryType: SalaryType;

  @Prop({ required: true, min: 0 })
  baseSalary: number; // in cents/paise

  @Prop({ min: 0, default: 0 })
  hourlyRate?: number;

  @Prop({ min: 0, default: 0 })
  overtimeRate?: number; // per hour rate in cents/paise

  @Prop({ type: [{ name: { type: String, trim: true }, amount: { type: Number, min: 0 } }], default: [] })
  allowances?: { name: string; amount: number }[];

  @Prop({ type: [{ name: { type: String, trim: true }, amount: { type: Number, min: 0 } }], default: [] })
  deductions?: { name: string; amount: number }[];

  @Prop({ type: Date, default: Date.now })
  effectiveFrom: Date;
}

@Schema({ timestamps: true, collection: 'staff_profiles' })
export class StaffProfile {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true, uppercase: true })
  employeeCode: string;

  @Prop({ type: Date, required: true, default: Date.now })
  joiningDate: Date;

  @Prop({
    type: String,
    enum: Object.values(EmploymentType),
    default: EmploymentType.FULL_TIME,
    index: true,
  })
  employmentType: EmploymentType;

  @Prop({ trim: true })
  designation?: string;

  @Prop({ trim: true })
  department?: string;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true, index: true })
  primaryBranchId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Branch' }], default: [] })
  branchIds: Types.ObjectId[];

  @Prop()
  dateOfBirth?: Date;

  @Prop({ type: EmergencyContactSchema })
  emergencyContact?: EmergencyContactSchema;

  @Prop({ type: AddressSchema })
  address?: AddressSchema;

  @Prop({ type: BankDetailsSchema })
  bankDetails?: BankDetailsSchema;

  @Prop({ trim: true })
  governmentId?: string;

  @Prop({ type: SalaryConfigurationSchema })
  salaryConfiguration?: SalaryConfigurationSchema;

  @Prop({
    type: String,
    enum: Object.values(StaffStatus),
    default: StaffStatus.ACTIVE,
    index: true,
  })
  status: StaffStatus;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ trim: true })
  notes?: string;
}

export const StaffProfileSchema = SchemaFactory.createForClass(StaffProfile);

StaffProfileSchema.index({ tenantId: 1, employeeCode: 1 }, { unique: true });
StaffProfileSchema.index({ tenantId: 1, userId: 1 }, { unique: true });
StaffProfileSchema.index({ tenantId: 1, status: 1 });
StaffProfileSchema.index({ tenantId: 1, primaryBranchId: 1 });
