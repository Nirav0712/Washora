import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true, collection: 'categories' })
export class Category {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', default: null, index: true })
  branchId?: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Branch' }], default: [] })
  branchIds?: Types.ObjectId[];

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true, lowercase: true })
  slug?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  image?: string;

  @Prop({ trim: true, default: 'Shirt' })
  icon?: string;

  @Prop({ trim: true, default: '#3B82F6' })
  color?: string;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deletedBy?: Types.ObjectId;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.index({ tenantId: 1, name: 1 });
CategorySchema.index({ tenantId: 1, isActive: 1, isDeleted: 1 });
CategorySchema.index({ tenantId: 1, branchId: 1 });
