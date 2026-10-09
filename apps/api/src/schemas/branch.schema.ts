import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BranchDocument = Branch & Document;

@Schema({ timestamps: true, collection: 'branches' })
export class Branch {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, uppercase: true })
  code: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ trim: true })
  city?: string;

  @Prop({ trim: true })
  state?: string;

  @Prop({ trim: true, default: 'India' })
  country?: string;

  @Prop({ trim: true })
  pincode?: string;

  @Prop({ default: 5.0 })
  taxRate: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isMainHub: boolean;

  @Prop({
    type: {
      tagWidthMm: { type: Number, default: 50 },
      tagHeightMm: { type: Number, default: 25 },
      autoPrintOnOrder: { type: Boolean, default: true },
    },
    default: {},
  })
  printerSettings?: {
    tagWidthMm: number;
    tagHeightMm: number;
    autoPrintOnOrder: boolean;
  };

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deletedBy?: Types.ObjectId;
}

export const BranchSchema = SchemaFactory.createForClass(Branch);

// Unique code within tenant
BranchSchema.index({ tenantId: 1, code: 1 }, { unique: true });
BranchSchema.index({ tenantId: 1, isActive: 1, isDeleted: 1 });
