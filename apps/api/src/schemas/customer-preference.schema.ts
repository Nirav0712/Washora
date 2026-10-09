import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CustomerPreferenceDocument = CustomerPreference & Document;

@Schema({ timestamps: true })
export class CustomerPreference {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customerId: Types.ObjectId;

  @Prop({ default: true })
  whatsappEnabled: boolean;

  @Prop({ default: true })
  smsEnabled: boolean;

  @Prop({ default: true })
  emailEnabled: boolean;

  @Prop({ default: true })
  transactionalEnabled: boolean;

  @Prop({ default: false })
  marketingEnabled: boolean;

  @Prop({ default: 'en_US', trim: true })
  preferredLanguage: string;
}

export const CustomerPreferenceSchema =
  SchemaFactory.createForClass(CustomerPreference);

CustomerPreferenceSchema.index(
  { tenantId: 1, customerId: 1 },
  { unique: true },
);
