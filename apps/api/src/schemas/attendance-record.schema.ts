import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AttendanceStatus, AttendanceSource } from '@washora/shared';

export type AttendanceRecordDocument = AttendanceRecord & Document;

@Schema({ timestamps: true, collection: 'attendance_records' })
export class AttendanceRecord {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true, index: true })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'StaffProfile', required: true, index: true })
  staffId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true }) // YYYY-MM-DD
  date: string;

  @Prop()
  checkInAt?: Date;

  @Prop()
  checkOutAt?: Date;

  @Prop({
    type: String,
    enum: Object.values(AttendanceStatus),
    default: AttendanceStatus.PRESENT,
    index: true,
  })
  status: AttendanceStatus;

  @Prop({ default: 0, min: 0 })
  workMinutes: number;

  @Prop({ default: 0, min: 0 })
  overtimeMinutes: number;

  @Prop({
    type: String,
    enum: Object.values(AttendanceSource),
    default: AttendanceSource.WEB,
  })
  source: AttendanceSource;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ trim: true })
  correctionReason?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  correctedBy?: Types.ObjectId;

  @Prop()
  correctedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop()
  approvedAt?: Date;
}

export const AttendanceRecordSchema = SchemaFactory.createForClass(AttendanceRecord);

AttendanceRecordSchema.index({ tenantId: 1, staffId: 1, date: 1 }, { unique: true });
AttendanceRecordSchema.index({ tenantId: 1, branchId: 1, date: 1 });
AttendanceRecordSchema.index({ tenantId: 1, status: 1, date: 1 });
