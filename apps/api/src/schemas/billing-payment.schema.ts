import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BillingPaymentStatus } from '@washora/shared';

export type BillingPaymentDocument = BillingPayment & Document;

@Schema({ timestamps: true, collection: 'billing_payments' })
export class BillingPayment {
  @Prop({ required: true })
  paymentNumber: string; // e.g. SPAY-000001

  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'BillingInvoice', required: true })
  invoiceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TenantSubscription', required: true })
  subscriptionId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ default: 'INR', uppercase: true })
  currency: string;

  @Prop({
    type: String,
    enum: Object.values(BillingPaymentStatus),
    default: BillingPaymentStatus.PENDING,
  })
  status: BillingPaymentStatus;

  @Prop({ default: 'MOCK_GATEWAY' })
  provider: string;

  @Prop({ trim: true })
  providerPaymentId?: string;

  @Prop({ type: Date })
  paidAt?: Date;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;
}

export const BillingPaymentSchema = SchemaFactory.createForClass(BillingPayment);
BillingPaymentSchema.index({ paymentNumber: 1 }, { unique: true });
BillingPaymentSchema.index({ tenantId: 1, createdAt: -1 });
BillingPaymentSchema.index({ invoiceId: 1 });
BillingPaymentSchema.index({ providerPaymentId: 1 });
