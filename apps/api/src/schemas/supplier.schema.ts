import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SupplierDocument = Supplier & Document;

@Schema({ timestamps: true, collection: 'suppliers' })
export class Supplier {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  supplierCode: string;

  @Prop({ required: true, trim: true })
  businessName: string;

  @Prop({ trim: true })
  contactPerson?: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ trim: true })
  alternatePhone?: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ trim: true, uppercase: true })
  gstNumber?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ type: [String], default: [] })
  categories: string[];

  @Prop({ default: 0 })
  openingBalance: number; // in cents/paise

  @Prop({ default: 0 })
  currentBalance: number; // in cents/paise

  @Prop({ trim: true })
  paymentTerms?: string;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);

SupplierSchema.index({ tenantId: 1, supplierCode: 1 }, { unique: true });
SupplierSchema.index({ tenantId: 1, businessName: 1 });
SupplierSchema.index({ tenantId: 1, currentBalance: 1 });
SupplierSchema.index({ tenantId: 1, isActive: 1, isDeleted: 1 });
