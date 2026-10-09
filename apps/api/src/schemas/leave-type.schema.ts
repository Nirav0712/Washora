import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LeaveTypeDocument = LeaveType & Document;

@Schema({ timestamps: true, collection: 'leave_types' })
export class LeaveType {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, uppercase: true })
  code: string;

  @Prop({ default: true })
  paid: boolean;

  @Prop({ default: 12, min: 0 })
  annualLimit: number;

  @Prop({ default: true })
  requiresApproval: boolean;

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const LeaveTypeSchema = SchemaFactory.createForClass(LeaveType);

LeaveTypeSchema.index({ tenantId: 1, code: 1 }, { unique: true });
LeaveTypeSchema.index({ tenantId: 1, isActive: 1 });
