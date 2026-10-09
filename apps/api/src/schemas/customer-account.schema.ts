import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CustomerAccountStatus } from '@washora/shared';

export type CustomerAccountDocument = CustomerAccount & Document;

@Schema({ timestamps: true, collection: 'customer_accounts' })
export class CustomerAccount {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customerId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ default: true })
  isPhoneVerified: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({
    type: String,
    enum: Object.values(CustomerAccountStatus),
    default: CustomerAccountStatus.ACTIVE,
  })
  status: CustomerAccountStatus;

  @Prop()
  lastLoginAt?: Date;

  @Prop({ trim: true })
  otpCodeHash?: string;

  @Prop()
  otpExpiresAt?: Date;

  @Prop({ type: [String], default: [] })
  sessionTokens: string[];
}

export const CustomerAccountSchema = SchemaFactory.createForClass(CustomerAccount);

// Indexes
CustomerAccountSchema.index({ tenantId: 1, phone: 1 }, { unique: true });
CustomerAccountSchema.index({ tenantId: 1, customerId: 1 });
CustomerAccountSchema.index({ tenantId: 1, status: 1 });
