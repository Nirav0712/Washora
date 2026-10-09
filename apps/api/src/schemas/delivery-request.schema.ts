import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  DeliveryStatus,
  LogisticsPriority,
  PaymentMethod,
} from '@washora/shared';
import {
  AddressSnapshotSchema,
  AddressSnapshotSubschema,
  LogisticsAttemptSchema,
  LogisticsAttemptSubschema,
  RescheduleHistorySchema,
  RescheduleHistorySubschema,
} from './pickup-request.schema';

export type DeliveryRequestDocument = DeliveryRequest & Document;

@Schema({ _id: false })
export class ProofOfDeliverySubschema {
  @Prop({ trim: true })
  recipientName?: string;

  @Prop({ trim: true })
  recipientPhone?: string;

  @Prop({ trim: true })
  deliveryNote?: string;

  @Prop({ trim: true })
  signatureUrl?: string;

  @Prop({ trim: true })
  photoUrl?: string;

  @Prop({ default: false })
  otpVerified?: boolean;

  @Prop()
  otpVerifiedAt?: Date;
}

export const ProofOfDeliverySchema = SchemaFactory.createForClass(ProofOfDeliverySubschema);

@Schema({ timestamps: true, collection: 'delivery_requests' })
export class DeliveryRequest {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true })
  branchId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  deliveryNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  deliveryAddressId?: Types.ObjectId;

  @Prop({ type: AddressSnapshotSchema, required: true })
  deliveryAddress: AddressSnapshotSubschema;

  @Prop({ required: true, trim: true })
  scheduledDate: string; // YYYY-MM-DD

  @Prop({ trim: true })
  scheduledTimeFrom?: string; // HH:mm

  @Prop({ trim: true })
  scheduledTimeTo?: string; // HH:mm

  @Prop({ type: Types.ObjectId, ref: 'StaffProfile' })
  assignedAgentId?: Types.ObjectId;

  @Prop({ type: String, enum: DeliveryStatus, default: DeliveryStatus.REQUESTED })
  status: DeliveryStatus;

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
  outForDeliveryAt?: Date;

  @Prop()
  arrivedAt?: Date;

  @Prop()
  deliveredAt?: Date;

  @Prop({ type: ProofOfDeliverySchema })
  proofOfDelivery?: ProofOfDeliverySubschema;

  @Prop({ default: 0 })
  collectionAmount: number; // in cents/paise

  @Prop({ type: String, enum: PaymentMethod })
  collectionPaymentMethod?: string;

  @Prop({ type: Types.ObjectId, ref: 'Payment' })
  collectionPaymentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  collectedBy?: Types.ObjectId;

  @Prop()
  collectedAt?: Date;

  @Prop({ trim: true })
  cancellationReason?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}

export const DeliveryRequestSchema = SchemaFactory.createForClass(DeliveryRequest);

DeliveryRequestSchema.index({ tenantId: 1, deliveryNumber: 1 }, { unique: true });
DeliveryRequestSchema.index({ tenantId: 1, branchId: 1, status: 1 });
DeliveryRequestSchema.index({ tenantId: 1, branchId: 1, scheduledDate: -1 });
DeliveryRequestSchema.index({ tenantId: 1, assignedAgentId: 1, scheduledDate: -1 });
DeliveryRequestSchema.index({ tenantId: 1, customerId: 1, scheduledDate: -1 });
DeliveryRequestSchema.index({ tenantId: 1, orderId: 1 });
