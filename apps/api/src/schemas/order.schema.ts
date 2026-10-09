import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  PricingTier,
  UnitType,
  DiscountType,
} from '@washora/shared';

export type OrderDocument = Order & Document;

@Schema({ _id: true })
export class OrderItemSnapshot {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  categoryId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Service' })
  serviceId?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  productNameSnapshot: string;

  @Prop({ trim: true })
  categoryNameSnapshot?: string;

  @Prop({ trim: true })
  serviceNameSnapshot?: string;

  @Prop({
    type: String,
    enum: Object.values(PricingTier),
    default: PricingTier.REGULAR,
  })
  pricingTier: PricingTier;

  @Prop({
    type: String,
    enum: Object.values(UnitType),
    default: UnitType.PIECE,
  })
  unit: UnitType;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ required: true, min: 0 })
  lineSubtotal: number;

  @Prop({ default: 0, min: 0 })
  taxRate: number;

  @Prop({ default: 0, min: 0 })
  taxAmount: number;

  @Prop({ default: 0, min: 0 })
  discountAmount: number;

  @Prop({ required: true, min: 0 })
  lineTotal: number;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ trim: true })
  garmentColor?: string;

  @Prop({ trim: true })
  garmentBrand?: string;

  @Prop({ type: [String], default: [] })
  defectsNoted: string[];

  @Prop({ trim: true })
  barcode?: string;
}

export const OrderItemSnapshotSchema = SchemaFactory.createForClass(OrderItemSnapshot);

@Schema({ _id: false })
export class OrderTimelineEvent {
  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    required: true,
  })
  status: OrderStatus;

  @Prop({ required: true, trim: true })
  label: string;

  @Prop({ default: Date.now })
  timestamp: Date;

  @Prop({ trim: true })
  updatedBy: string;

  @Prop({ trim: true })
  note?: string;

  @Prop({ default: true })
  isCompleted: boolean;
}

export const OrderTimelineEventSchema = SchemaFactory.createForClass(OrderTimelineEvent);

@Schema({ timestamps: true, collection: 'orders' })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true })
  branchId: Types.ObjectId;

  @Prop({ required: true, trim: true, uppercase: true })
  orderNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customerId: Types.ObjectId;

  @Prop({
    type: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String },
      address: { type: String },
    },
    required: true,
  })
  customerSnapshot: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
  };

  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.RECEIVED,
    index: true,
  })
  status: OrderStatus;

  @Prop({ type: [OrderItemSnapshotSchema], required: true, default: [] })
  items: OrderItemSnapshot[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Garment' }], default: [] })
  garmentIds: Types.ObjectId[];

  @Prop({ default: 0, min: 0 })
  itemCount: number;

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({
    type: String,
    enum: Object.values(DiscountType),
    default: DiscountType.AMOUNT,
  })
  discountType: DiscountType;

  @Prop({ default: 0, min: 0 })
  discountValue: number;

  @Prop({ default: 0, min: 0 })
  discountAmount: number;

  @Prop({ default: 0, min: 0 })
  taxableAmount: number;

  @Prop({ default: 5.0, min: 0 })
  taxRate: number;

  @Prop({ default: 0, min: 0 })
  taxAmount: number;

  @Prop({ required: true, min: 0 })
  grandTotal: number;

  @Prop({ default: 0, min: 0 })
  paidAmount: number;

  @Prop({ default: 0, min: 0 })
  dueAmount: number;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.UNPAID,
    index: true,
  })
  paymentStatus: PaymentStatus;

  @Prop({
    type: String,
    enum: Object.values(PaymentMethod),
    default: PaymentMethod.CASH,
  })
  paymentMethod?: PaymentMethod;

  @Prop({
    type: String,
    enum: Object.values(PricingTier),
    default: PricingTier.REGULAR,
  })
  pricingTier: PricingTier;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ trim: true })
  internalNotes?: string;

  @Prop({ default: false })
  pickupRequired: boolean;

  @Prop({ default: false })
  deliveryRequired: boolean;

  @Prop({ type: [OrderTimelineEventSchema], default: [] })
  timeline: OrderTimelineEvent[];

  @Prop()
  expectedReadyAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ trim: true })
  trackingToken?: string;

  @Prop({ trim: true })
  trackingTokenHash?: string;

  @Prop()
  trackingTokenCreatedAt?: Date;

  @Prop()
  trackingTokenExpiresAt?: Date;

  @Prop()
  trackingTokenRevokedAt?: Date;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Indexes
OrderSchema.index({ tenantId: 1, orderNumber: 1 }, { unique: true });
OrderSchema.index({ tenantId: 1, customerId: 1 });
OrderSchema.index({ tenantId: 1, branchId: 1, status: 1 });
OrderSchema.index({ tenantId: 1, status: 1 });
OrderSchema.index({ tenantId: 1, paymentStatus: 1 });
OrderSchema.index({ tenantId: 1, createdAt: -1 });
OrderSchema.index({ trackingTokenHash: 1 }, { sparse: true });
