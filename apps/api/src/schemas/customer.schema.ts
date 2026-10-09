import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

import { AddressType } from '@washora/shared';

export type CustomerDocument = Customer & Document;

@Schema({ _id: true })
export class CustomerAddress {
  @Prop({ default: 'Home', trim: true })
  label: string;

  @Prop({ type: String, enum: Object.values(AddressType), default: AddressType.HOME })
  type?: AddressType;

  @Prop({ trim: true })
  name?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  addressLine1: string;

  @Prop({ trim: true })
  addressLine2?: string;

  @Prop({ trim: true })
  area?: string;

  @Prop({ trim: true })
  city?: string;

  @Prop({ trim: true })
  state?: string;

  @Prop({ trim: true, default: 'India' })
  country?: string;

  @Prop({ trim: true })
  pincode?: string;

  @Prop({ trim: true })
  landmark?: string;

  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;

  @Prop({ default: false })
  isDefault: boolean;
}

export const CustomerAddressSchema = SchemaFactory.createForClass(CustomerAddress);

@Schema({ timestamps: true, collection: 'customers' })
export class Customer {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Branch' }], default: [] })
  branchIds: Types.ObjectId[];

  @Prop({ trim: true, uppercase: true })
  customerCode?: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, index: true })
  phone: string;

  @Prop({ trim: true })
  alternatePhone?: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ trim: true })
  gender?: string;

  @Prop({ trim: true })
  dateOfBirth?: string;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [CustomerAddressSchema], default: [] })
  addresses: CustomerAddress[];

  @Prop({ default: false })
  isVip: boolean;

  @Prop({ default: 0 })
  totalOrders: number;

  @Prop({ default: 0 })
  totalSpent: number;

  @Prop({ default: 0 })
  pendingBalance: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deletedBy?: Types.ObjectId;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

// Indexes
CustomerSchema.index({ tenantId: 1, phone: 1 });
CustomerSchema.index({ tenantId: 1, customerCode: 1 }, { sparse: true });
CustomerSchema.index({ tenantId: 1, isActive: 1, isDeleted: 1 });
CustomerSchema.index({ tenantId: 1, name: 1 });
CustomerSchema.index({ tenantId: 1, isVip: 1 });
CustomerSchema.index({ tenantId: 1, createdAt: -1 });
