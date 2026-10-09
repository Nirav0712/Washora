import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentMethod, PaymentStatus } from '@washora/shared';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true, collection: 'payments' })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true, index: true })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true, index: true })
  customerId: Types.ObjectId;

  @Prop({ required: true, trim: true, uppercase: true })
  paymentNumber: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({
    type: String,
    enum: Object.values(PaymentMethod),
    default: PaymentMethod.CASH,
  })
  method: PaymentMethod;

  @Prop({
    type: String,
    enum: ['COMPLETED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'VOID'],
    default: 'COMPLETED',
  })
  status: string;

  @Prop({ trim: true })
  referenceNumber?: string;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ default: 0, min: 0 })
  refundAmount: number;

  @Prop({ trim: true })
  refundReason?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  receivedBy?: Types.ObjectId;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ tenantId: 1, orderId: 1 });
PaymentSchema.index({ tenantId: 1, customerId: 1 });
PaymentSchema.index({ tenantId: 1, branchId: 1 });
PaymentSchema.index({ tenantId: 1, paymentNumber: 1 });
PaymentSchema.index({ tenantId: 1, createdAt: -1 });
