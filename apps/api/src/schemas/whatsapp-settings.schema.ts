import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WhatsAppSettingsDocument = WhatsAppSettings & Document;

@Schema({ timestamps: true })
export class WhatsAppSettings {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, unique: true })
  tenantId: Types.ObjectId;

  @Prop({ default: false })
  enabled: boolean;

  @Prop({ default: 'META_OFFICIAL', trim: true })
  provider: string;

  @Prop({ trim: true })
  phoneNumberId?: string;

  @Prop({ trim: true })
  businessAccountId?: string;

  @Prop({ trim: true })
  accessTokenReference?: string;

  @Prop({ default: false })
  webhookEnabled: boolean;

  @Prop({ trim: true })
  webhookVerifyTokenReference?: string;

  @Prop({ default: 'en_US', trim: true })
  defaultLanguage: string;

  @Prop({ default: false })
  isConfigured: boolean;
}

export const WhatsAppSettingsSchema =
  SchemaFactory.createForClass(WhatsAppSettings);
