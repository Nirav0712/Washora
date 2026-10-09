import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { InventoryUnit } from '@washora/shared';

export type PurchaseItemDocument = PurchaseItem & Document;

@Schema({ timestamps: true, collection: 'purchase_items' })
export class PurchaseItem {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Purchase', required: true, index: true })
  purchaseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'InventoryItem', required: true, index: true })
  inventoryItemId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  itemNameSnapshot: string;

  @Prop({ type: String, enum: InventoryUnit, default: InventoryUnit.PIECE })
  unit: InventoryUnit;

  @Prop({ required: true, min: 0.001 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  unitCost: number; // in cents/paise

  @Prop({ default: 0 })
  taxRate?: number;

  @Prop({ default: 0 })
  taxAmount?: number; // in cents/paise

  @Prop({ required: true, min: 0 })
  lineTotal: number; // in cents/paise
}

export const PurchaseItemSchema = SchemaFactory.createForClass(PurchaseItem);

PurchaseItemSchema.index({ tenantId: 1, purchaseId: 1 });
PurchaseItemSchema.index({ tenantId: 1, inventoryItemId: 1 });
