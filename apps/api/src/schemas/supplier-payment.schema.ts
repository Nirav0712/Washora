import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ExpensePaymentMethod } from '@washora/shared';

export type SupplierPaymentDocument = SupplierPayment & Document;

@Schema({ timestamps: true, collection: 'supplier_payments' })
export class SupplierPayment {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', index: true })
  branchId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Supplier', required: true, index: true })
  supplierId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  paymentNumber: string;

  @Prop({ required: true, min: 1 })
  amount: number; // in cents/paise

  @Prop({ type: String, enum: ExpensePaymentMethod, default: ExpensePaymentMethod.CASH })
  paymentMethod: ExpensePaymentMethod;

  @Prop({ trim: true })
  referenceNumber?: string;

  @Prop({ required: true, default: () => new Date().toISOString().split('T')[0] })
  paymentDate: string; // YYYY-MM-DD

  @Prop({ type: Types.ObjectId, ref: 'Purchase' })
  purchaseId?: Types.ObjectId;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;
}

export const SupplierPaymentSchema = SchemaFactory.createForClass(SupplierPayment);

SupplierPaymentSchema.index({ tenantId: 1, paymentNumber: 1 }, { unique: true });
SupplierPaymentSchema.index({ tenantId: 1, supplierId: 1, paymentDate: -1 });
SupplierPaymentSchema.index({ tenantId: 1, branchId: 1 });
