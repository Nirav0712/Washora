import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  PickupStatus,
  LogisticsPriority,
} from '@washora/shared';

export type PickupRequestDocument = PickupRequest & Document;

@Schema({ _id: false })
export class AddressSnapshotSubschema {
  @Prop({ trim: true })
  label?: string;

  @Prop({ trim: true })
  name?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  addressLine1?: string;

  @Prop({ trim: true })
  addressLine2?: string;

  @Prop({ trim: true })
  area?: string;

  @Prop({ trim: true })
  city?: string;

  @Prop({ trim: true })
  state?: string;

  @Prop({ trim: true, default: 'India' })
  country?: string;

  @Prop({ trim: true })
  pincode?: string;

  @Prop({ trim: true })
  landmark?: string;

  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;
}

export const AddressSnapshotSchema = SchemaFactory.createForClass(AddressSnapshotSubschema);

@Schema({ _id: true, timestamps: { createdAt: true, updatedAt: false } })
export class LogisticsAttemptSubschema {
  @Prop({ required: true, default: 1 })
  attemptNumber: number;

  @Prop({ required: true, default: () => new Date() })
  attemptedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'StaffProfile' })
  agentId?: Types.ObjectId;

  @Prop({ trim: true })
  agentName?: string;

  @Prop({ required: true, trim: true })
  reason: string;

  @Prop({ trim: true })
  notes?: string;
}

export const LogisticsAttemptSchema = SchemaFactory.createForClass(LogisticsAttemptSubschema);

@Schema({ _id: true, timestamps: { createdAt: true, updatedAt: false } })
export class RescheduleHistorySubschema {
  @Prop({ trim: true })
  previousDate?: string;

  @Prop({ trim: true })
  previousTimeFrom?: string;

  @Prop({ trim: true })
  previousTimeTo?: string;

  @Prop({ required: true, trim: true })
  newDate: string;

  @Prop({ trim: true })
  newTimeFrom?: string;

  @Prop({ trim: true })
  newTimeTo?: string;

  @Prop({ trim: true })
  reason?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  changedBy?: Types.ObjectId;

  @Prop({ required: true, default: () => new Date() })
  changedAt: Date;
}

export const RescheduleHistorySchema = SchemaFactory.createForClass(RescheduleHistorySubschema);

@Schema({ timestamps: true, collection: 'pickup_requests' })
export class PickupRequest {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true })
  branchId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  pickupNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  orderId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  pickupAddressId?: Types.ObjectId;

  @Prop({ type: AddressSnapshotSchema, required: true })
  pickupAddress: AddressSnapshotSubschema;

  @Prop({ required: true, trim: true })
  scheduledDate: string; // YYYY-MM-DD

  @Prop({ trim: true })
  scheduledTimeFrom?: string; // HH:mm

  @Prop({ trim: true })
  scheduledTimeTo?: string; // HH:mm

  @Prop({ type: Types.ObjectId, ref: 'StaffProfile' })
  assignedAgentId?: Types.ObjectId;

  @Prop({ type: String, enum: PickupStatus, default: PickupStatus.REQUESTED })
  status: PickupStatus;

  @Prop({ type: String, enum: LogisticsPriority, default: LogisticsPriority.NORMAL })
  priority: LogisticsPriority;

  @Prop({ trim: true })
  specialInstructions?: string;

  @Prop({ trim: true })
  customerNotes?: string;

  @Prop({ trim: true })
  internalNotes?: string;

  @Prop({ default: 0 })
  attemptCount: number;

  @Prop()
  lastAttemptAt?: Date;

  @Prop({ type: [LogisticsAttemptSchema], default: [] })
  attempts: LogisticsAttemptSubschema[];

  @Prop({ type: [RescheduleHistorySchema], default: [] })
  rescheduleHistory: RescheduleHistorySubschema[];

  @Prop()
  outForPickupAt?: Date;

  @Prop()
  arrivedAt?: Date;

  @Prop()
  pickedUpAt?: Date;

  @Prop({ trim: true })
  cancellationReason?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}

export const PickupRequestSchema = SchemaFactory.createForClass(PickupRequest);

PickupRequestSchema.index({ tenantId: 1, pickupNumber: 1 }, { unique: true });
PickupRequestSchema.index({ tenantId: 1, branchId: 1, status: 1 });
PickupRequestSchema.index({ tenantId: 1, branchId: 1, scheduledDate: -1 });
PickupRequestSchema.index({ tenantId: 1, assignedAgentId: 1, scheduledDate: -1 });
PickupRequestSchema.index({ tenantId: 1, customerId: 1, scheduledDate: -1 });
PickupRequestSchema.index({ tenantId: 1, orderId: 1 });
