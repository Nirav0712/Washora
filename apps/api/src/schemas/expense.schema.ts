import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ExpenseStatus, ExpensePaymentMethod } from '@washora/shared';

export type ExpenseDocument = Expense & Document;

@Schema({ timestamps: true, collection: 'expenses' })
export class Expense {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', index: true })
  branchId?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  expenseNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'ExpenseCategory', required: true, index: true })
  categoryId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, min: 1 })
  amount: number; // in cents/paise

  @Prop({ required: true, default: () => new Date().toISOString().split('T')[0] })
  expenseDate: string; // YYYY-MM-DD

  @Prop({ type: String, enum: ExpensePaymentMethod, default: ExpensePaymentMethod.CASH })
  paymentMethod: ExpensePaymentMethod;

  @Prop({ type: Types.ObjectId, ref: 'Supplier', index: true })
  supplierId?: Types.ObjectId;

  @Prop({ type: String, enum: ExpenseStatus, default: ExpenseStatus.DRAFT, index: true })
  status: ExpenseStatus;

  @Prop({ trim: true })
  attachmentUrl?: string;

  @Prop({ trim: true })
  referenceNumber?: string;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop()
  approvedAt?: Date;

  @Prop()
  paidAt?: Date;

  @Prop({ trim: true })
  rejectionReason?: string;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);

ExpenseSchema.index({ tenantId: 1, expenseNumber: 1 }, { unique: true });
ExpenseSchema.index({ tenantId: 1, branchId: 1, expenseDate: -1 });
ExpenseSchema.index({ tenantId: 1, categoryId: 1, expenseDate: -1 });
ExpenseSchema.index({ tenantId: 1, status: 1 });
ExpenseSchema.index({ tenantId: 1, supplierId: 1 });
