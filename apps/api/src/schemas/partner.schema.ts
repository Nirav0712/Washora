import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PartnerDocument = Partner & Document;

@Schema({ timestamps: true, collection: 'partners' })
export class Partner {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  companyName?: string;

  @Prop({ required: true, uppercase: true, trim: true })
  code: string; // e.g. PARTNER-BLR-01

  @Prop({ default: 15 }) // Commission rate percentage e.g. 15%
  commissionRate: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Tenant' }], default: [] })
  assignedTenantIds: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'PlatformAdmin' })
  adminUserId?: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  metrics: {
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    monthlyRevenue: number;
  };
}

export const PartnerSchema = SchemaFactory.createForClass(Partner);
PartnerSchema.index({ code: 1 }, { unique: true });
PartnerSchema.index({ email: 1 });
PartnerSchema.index({ isActive: 1 });
