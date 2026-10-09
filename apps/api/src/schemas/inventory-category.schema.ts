import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InventoryCategoryDocument = InventoryCategory & Document;

@Schema({ timestamps: true, collection: 'inventory_categories' })
export class InventoryCategory {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, uppercase: true })
  code: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const InventoryCategorySchema = SchemaFactory.createForClass(InventoryCategory);

InventoryCategorySchema.index({ tenantId: 1, code: 1 }, { unique: true });
InventoryCategorySchema.index({ tenantId: 1, isActive: 1 });
