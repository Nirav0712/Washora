import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BillingInvoiceStatus } from '@washora/shared';

export type BillingInvoiceDocument = BillingInvoice & Document;

@Schema({ timestamps: true, collection: 'billing_invoices' })
export class BillingInvoice {
  @Prop({ required: true })
  invoiceNumber: string; // e.g. SINV-000001

  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TenantSubscription', required: true })
  subscriptionId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  billingPeriodStart: Date;

  @Prop({ type: Date, required: true })
  billingPeriodEnd: Date;

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ default: 0, min: 0 })
  tax: number;

  @Prop({ default: 0, min: 0 })
  discount: number;

  @Prop({ required: true, min: 0 })
  total: number;

  @Prop({ default: 'INR', uppercase: true })
  currency: string;

  @Prop({
    type: String,
    enum: Object.values(BillingInvoiceStatus),
    default: BillingInvoiceStatus.OPEN,
  })
  status: BillingInvoiceStatus;

  @Prop({ type: Date, default: Date.now })
  issuedAt: Date;

  @Prop({ type: Date, required: true })
  dueAt: Date;

  @Prop({ type: Date })
  paidAt?: Date;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;
}

export const BillingInvoiceSchema = SchemaFactory.createForClass(BillingInvoice);
BillingInvoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
BillingInvoiceSchema.index({ tenantId: 1, createdAt: -1 });
BillingInvoiceSchema.index({ status: 1 });
