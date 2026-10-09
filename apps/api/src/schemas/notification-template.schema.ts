import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  NotificationEventType,
  NotificationChannel,
  TemplateStatus,
  WhatsAppCategory,
} from '@washora/shared';

export type NotificationTemplateDocument = NotificationTemplate & Document;

@Schema({ timestamps: true })
export class NotificationTemplate {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', default: null })
  branchId?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    type: String,
    enum: Object.values(NotificationEventType),
    required: true,
  })
  eventType: NotificationEventType;

  @Prop({
    type: String,
    enum: Object.values(NotificationChannel),
    default: NotificationChannel.WHATSAPP,
    required: true,
  })
  channel: NotificationChannel;

  @Prop({ required: true, trim: true })
  templateKey: string;

  @Prop({ trim: true })
  providerTemplateId?: string;

  @Prop({ default: 'en_US', trim: true })
  language: string;

  @Prop({
    type: String,
    enum: Object.values(WhatsAppCategory),
    default: WhatsAppCategory.UTILITY,
  })
  category?: WhatsAppCategory;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [String], default: [] })
  variables: string[];

  @Prop({
    type: String,
    enum: Object.values(TemplateStatus),
    default: TemplateStatus.APPROVED,
  })
  status: TemplateStatus;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  updatedBy?: Types.ObjectId;
}

export const NotificationTemplateSchema =
  SchemaFactory.createForClass(NotificationTemplate);

NotificationTemplateSchema.index({ tenantId: 1, templateKey: 1 });
NotificationTemplateSchema.index({ tenantId: 1, eventType: 1, isDefault: 1 });
NotificationTemplateSchema.index({ tenantId: 1, branchId: 1 });
