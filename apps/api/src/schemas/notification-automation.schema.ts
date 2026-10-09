import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { NotificationEventType, NotificationChannel } from '@washora/shared';

export type NotificationAutomationDocument = NotificationAutomation & Document;

@Schema({ _id: false })
export class NotificationAutomationRuleSubschema {
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

  @Prop({ default: true })
  enabled: boolean;

  @Prop({ trim: true })
  templateKey?: string;

  @Prop({ type: Types.ObjectId, ref: 'NotificationTemplate', default: null })
  templateId?: Types.ObjectId;
}

export const NotificationAutomationRuleSchema =
  SchemaFactory.createForClass(NotificationAutomationRuleSubschema);

@Schema({ timestamps: true })
export class NotificationAutomation {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, unique: true })
  tenantId: Types.ObjectId;

  @Prop({ type: [NotificationAutomationRuleSchema], default: [] })
  rules: NotificationAutomationRuleSubschema[];
}

export const NotificationAutomationSchema =
  SchemaFactory.createForClass(NotificationAutomation);
