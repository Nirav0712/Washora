import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PlatformContactSettingsDocument = PlatformContactSettings & Document;

@Schema({ timestamps: true, collection: 'platform_contact_settings' })
export class PlatformContactSettings {
  @Prop({ default: '+91 80 4680 1100', trim: true })
  serviceSupportNumber: string;

  @Prop({ default: '+91 80 4680 1101', trim: true })
  salesNumber: string;

  @Prop({ default: '+91 99000 88221', trim: true })
  companyConnectNumber: string;

  @Prop({ default: 'support@washora.com', trim: true, lowercase: true })
  supportEmail: string;

  @Prop({ default: 'sales@washora.com', trim: true, lowercase: true })
  salesEmail: string;

  @Prop({ default: '+91 99000 88221', trim: true })
  whatsappNumber: string;

  @Prop({ default: 'Monday - Saturday: 8:00 AM - 9:00 PM IST', trim: true })
  businessHours: string;

  @Prop({ type: Types.ObjectId, ref: 'PlatformAdmin' })
  updatedBy?: Types.ObjectId;
}

export const PlatformContactSettingsSchema = SchemaFactory.createForClass(PlatformContactSettings);
