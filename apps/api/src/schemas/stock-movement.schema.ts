import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { StockMovementType } from '@washora/shared';

export type StockMovementDocument = StockMovement & Document;

@Schema({ timestamps: true, collection: 'stock_movements' })
export class StockMovement {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true, index: true })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'InventoryItem', required: true, index: true })
  inventoryItemId: Types.ObjectId;

  @Prop({ type: String, enum: StockMovementType, required: true, index: true })
  type: StockMovementType;

  @Prop({ required: true })
  quantity: number; // positive or negative adjustment delta

  @Prop({ required: true })
  beforeQuantity: number;

  @Prop({ required: true })
  afterQuantity: number;

  @Prop({ default: 0 })
  unitCost: number; // in cents/paise

  @Prop({ trim: true })
  referenceType?: string; // PURCHASE, TRANSFER, MANUAL, ORDER

  @Prop({ trim: true })
  referenceId?: string;

  @Prop({ trim: true })
  reason?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  performedBy?: Types.ObjectId;
}

export const StockMovementSchema = SchemaFactory.createForClass(StockMovement);

StockMovementSchema.index({ tenantId: 1, inventoryItemId: 1, createdAt: -1 });
StockMovementSchema.index({ tenantId: 1, branchId: 1, createdAt: -1 });
StockMovementSchema.index({ tenantId: 1, referenceType: 1, referenceId: 1 });
