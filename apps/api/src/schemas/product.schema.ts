import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UnitType } from '@washora/shared';

export type ProductDocument = Product & Document;

@Schema({ _id: false })
export class ProductPricingTier {
  @Prop({ required: true, default: 0, min: 0 })
  regular: number;

  @Prop({ required: true, default: 0, min: 0 })
  express: number;

  @Prop({ required: true, default: 0, min: 0 })
  sameDay: number;

  @Prop({ default: 0, min: 0 })
  urgent?: number;

  @Prop({ default: 0, min: 0 })
  custom?: number;
}

export const ProductPricingTierSchema = SchemaFactory.createForClass(ProductPricingTier);

@Schema({ _id: false })
export class BranchPriceOverrideItem {
  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true })
  branchId: Types.ObjectId;

  @Prop({ type: ProductPricingTierSchema, required: true })
  prices: ProductPricingTier;
}

export const BranchPriceOverrideItemSchema = SchemaFactory.createForClass(BranchPriceOverrideItem);

@Schema({ timestamps: true, collection: 'products' })
export class Product {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true, index: true })
  categoryId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Service' }], default: [] })
  serviceIds: Types.ObjectId[];

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true, uppercase: true })
  sku?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  image?: string;

  @Prop({ trim: true })
  icon?: string;

  @Prop({
    type: String,
    enum: Object.values(UnitType),
    default: UnitType.PIECE,
  })
  unit: UnitType;

  @Prop({ type: ProductPricingTierSchema, required: true })
  prices: ProductPricingTier;

  @Prop({ type: [BranchPriceOverrideItemSchema], default: [] })
  branchPriceOverrides: BranchPriceOverrideItem[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Branch' }], default: [] })
  branchAvailability: Types.ObjectId[];

  @Prop({ default: 5.0, min: 0 })
  taxRate: number;

  @Prop({ default: true })
  isTaxable: boolean;

  @Prop({ default: 24, min: 0 })
  processingTimeHours: number;

  @Prop({ trim: true })
  careInstructions?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deletedBy?: Types.ObjectId;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// SKU is unique per tenant if provided
ProductSchema.index({ tenantId: 1, sku: 1 }, { unique: true, sparse: true });
ProductSchema.index({ tenantId: 1, categoryId: 1 });
ProductSchema.index({ tenantId: 1, isActive: 1, isDeleted: 1 });
ProductSchema.index({ tenantId: 1, name: 1 });
