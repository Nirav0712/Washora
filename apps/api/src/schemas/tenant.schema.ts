import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BusinessType, TenantStatus } from '@washora/shared';

export type TenantDocument = Tenant & Document;

@Schema({ timestamps: true, collection: 'tenants' })
export class Tenant {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, lowercase: true, trim: true })
  slug: string;

  @Prop({
    type: String,
    enum: Object.values(BusinessType),
    default: BusinessType.LAUNDRY,
  })
  businessType: BusinessType;

  @Prop({ trim: true })
  logo?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ trim: true })
  gstNumber?: string;

  @Prop({
    type: String,
    enum: Object.values(TenantStatus),
    default: TenantStatus.ACTIVE,
  })
  status: TenantStatus;

  @Prop({ type: Types.ObjectId, ref: 'Partner' })
  partnerId?: Types.ObjectId;

  @Prop({ trim: true, uppercase: true })
  partnerCode?: string;

  @Prop({ type: Object, default: {} })
  settings?: Record<string, any>;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);

TenantSchema.index({ slug: 1 }, { unique: true });
TenantSchema.index({ status: 1 });
TenantSchema.index({ partnerId: 1 });
TenantSchema.index({ partnerCode: 1 });
