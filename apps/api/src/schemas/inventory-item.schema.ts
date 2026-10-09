import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { InventoryUnit } from '@washora/shared';

export type InventoryItemDocument = InventoryItem & Document;

@Schema({ timestamps: true, collection: 'inventory_items' })
export class InventoryItem {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', index: true })
  branchId?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  inventoryCode: string;

  @Prop({ type: Types.ObjectId, ref: 'InventoryCategory', required: true, index: true })
  categoryId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: String, enum: InventoryUnit, default: InventoryUnit.PIECE })
  unit: InventoryUnit;

  @Prop({ required: true, default: 0 })
  currentStock: number;

  @Prop({ default: 0 })
  reservedStock: number;

  @Prop({ default: 0 })
  minimumStock: number;

  @Prop({ default: 0 })
  reorderLevel: number;

  @Prop({ default: 0 })
  averageCost: number; // in cents/paise

  @Prop({ default: 0 })
  lastPurchaseCost: number; // in cents/paise

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const InventoryItemSchema = SchemaFactory.createForClass(InventoryItem);

InventoryItemSchema.index({ tenantId: 1, inventoryCode: 1 }, { unique: true });
InventoryItemSchema.index({ tenantId: 1, branchId: 1, categoryId: 1 });
InventoryItemSchema.index({ tenantId: 1, branchId: 1, currentStock: 1 });
InventoryItemSchema.index({ tenantId: 1, branchId: 1, reorderLevel: 1 });
InventoryItemSchema.index({ tenantId: 1, isActive: 1, isDeleted: 1 });
