import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PurchaseStatus, PurchasePaymentStatus } from '@washora/shared';

export type PurchaseDocument = Purchase & Document;

@Schema({ timestamps: true, collection: 'purchases' })
export class Purchase {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true, index: true })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Supplier', required: true, index: true })
  supplierId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  purchaseNumber: string;

  @Prop({ required: true, default: () => new Date().toISOString().split('T')[0] })
  purchaseDate: string; // YYYY-MM-DD

  @Prop({ required: true, default: 0 })
  subtotal: number; // in cents/paise

  @Prop({ default: 0 })
  discount: number; // in cents/paise

  @Prop({ default: 0 })
  tax: number; // in cents/paise

  @Prop({ required: true, default: 0 })
  grandTotal: number; // in cents/paise

  @Prop({ default: 0 })
  paidAmount: number; // in cents/paise

  @Prop({ default: 0 })
  dueAmount: number; // in cents/paise

  @Prop({ type: String, enum: PurchaseStatus, default: PurchaseStatus.DRAFT, index: true })
  status: PurchaseStatus;

  @Prop({ type: String, enum: PurchasePaymentStatus, default: PurchasePaymentStatus.UNPAID, index: true })
  paymentStatus: PurchasePaymentStatus;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop()
  receivedAt?: Date;
}

export const PurchaseSchema = SchemaFactory.createForClass(Purchase);

PurchaseSchema.index({ tenantId: 1, purchaseNumber: 1 }, { unique: true });
PurchaseSchema.index({ tenantId: 1, supplierId: 1, purchaseDate: -1 });
PurchaseSchema.index({ tenantId: 1, branchId: 1, purchaseDate: -1 });
PurchaseSchema.index({ tenantId: 1, paymentStatus: 1 });
PurchaseSchema.index({ tenantId: 1, status: 1 });
