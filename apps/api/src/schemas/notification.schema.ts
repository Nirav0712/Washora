import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  NotificationEventType,
  NotificationChannel,
  NotificationStatus,
} from '@washora/shared';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', default: null })
  branchId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Customer', default: null })
  customerId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', default: null })
  orderId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(NotificationEventType),
    required: true,
  })
  eventType: NotificationEventType;

  @Prop({
    type: String,
    enum: Object.values(NotificationChannel),
    required: true,
  })
  channel: NotificationChannel;

  @Prop({ type: Types.ObjectId, ref: 'NotificationTemplate', default: null })
  templateId?: Types.ObjectId;

  @Prop({ trim: true })
  templateKey?: string;

  @Prop({ required: true, trim: true })
  recipient: string;

  @Prop({ required: true })
  renderedContent: string;

  @Prop({ type: Object, default: {} })
  variables: Record<string, any>;

  @Prop({
    type: String,
    enum: Object.values(NotificationStatus),
    default: NotificationStatus.QUEUED,
  })
  status: NotificationStatus;

  @Prop({ trim: true })
  providerMessageId?: string;

  @Prop({ type: Object, default: null })
  providerResponse?: Record<string, any>;

  @Prop({ trim: true })
  errorCode?: string;

  @Prop({ trim: true })
  errorMessage?: string;

  @Prop({ default: 0 })
  attemptCount: number;

  @Prop({ trim: true })
  idempotencyKey?: string;

  @Prop()
  queuedAt?: Date;

  @Prop()
  sentAt?: Date;

  @Prop()
  deliveredAt?: Date;

  @Prop()
  readAt?: Date;

  @Prop()
  failedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ tenantId: 1, createdAt: -1 });
NotificationSchema.index({ tenantId: 1, branchId: 1, createdAt: -1 });
NotificationSchema.index({ tenantId: 1, customerId: 1 });
NotificationSchema.index({ tenantId: 1, orderId: 1 });
NotificationSchema.index(
  { tenantId: 1, idempotencyKey: 1 },
  { unique: true, sparse: true },
);
NotificationSchema.index({ providerMessageId: 1 }, { sparse: true });
