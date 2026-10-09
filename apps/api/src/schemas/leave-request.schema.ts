import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { LeaveStatus } from '@washora/shared';

export type LeaveRequestDocument = LeaveRequest & Document;

@Schema({ timestamps: true, collection: 'leave_requests' })
export class LeaveRequest {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true, index: true })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'StaffProfile', required: true, index: true })
  staffId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'LeaveType', required: true, index: true })
  leaveTypeId: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true }) // YYYY-MM-DD
  startDate: string;

  @Prop({ required: true, trim: true, index: true }) // YYYY-MM-DD
  endDate: string;

  @Prop({ required: true, min: 0.5 })
  totalDays: number;

  @Prop({ required: true, trim: true })
  reason: string;

  @Prop({
    type: String,
    enum: Object.values(LeaveStatus),
    default: LeaveStatus.PENDING,
    index: true,
  })
  status: LeaveStatus;

  @Prop({ default: Date.now })
  requestedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop()
  approvedAt?: Date;

  @Prop({ trim: true })
  rejectionReason?: string;

  @Prop()
  cancelledAt?: Date;
}

export const LeaveRequestSchema = SchemaFactory.createForClass(LeaveRequest);

LeaveRequestSchema.index({ tenantId: 1, staffId: 1, startDate: 1 });
LeaveRequestSchema.index({ tenantId: 1, status: 1 });
LeaveRequestSchema.index({ tenantId: 1, branchId: 1, startDate: 1 });
