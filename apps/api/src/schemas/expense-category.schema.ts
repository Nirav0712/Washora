import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExpenseCategoryDocument = ExpenseCategory & Document;

@Schema({ timestamps: true, collection: 'expense_categories' })
export class ExpenseCategory {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, uppercase: true })
  code: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true, default: 'MoreHorizontal' })
  icon?: string;

  @Prop({ trim: true, default: '#6366F1' })
  color?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ExpenseCategorySchema = SchemaFactory.createForClass(ExpenseCategory);

ExpenseCategorySchema.index({ tenantId: 1, code: 1 }, { unique: true });
ExpenseCategorySchema.index({ tenantId: 1, isActive: 1 });
