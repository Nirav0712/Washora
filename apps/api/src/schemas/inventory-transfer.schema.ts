import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TransferStatus } from '@washora/shared';

export type InventoryTransferDocument = InventoryTransfer & Document;

@Schema({ timestamps: true, collection: 'inventory_transfers' })
export class InventoryTransfer {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true, index: true })
  fromBranchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true, index: true })
  toBranchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'InventoryItem', required: true, index: true })
  inventoryItemId: Types.ObjectId;

  @Prop({ required: true, min: 0.001 })
  quantity: number;

  @Prop({ type: String, enum: TransferStatus, default: TransferStatus.PENDING, index: true })
  status: TransferStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  requestedBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop()
  completedAt?: Date;

  @Prop({ trim: true })
  notes?: string;
}

export const InventoryTransferSchema = SchemaFactory.createForClass(InventoryTransfer);

InventoryTransferSchema.index({ tenantId: 1, fromBranchId: 1, createdAt: -1 });
InventoryTransferSchema.index({ tenantId: 1, toBranchId: 1, createdAt: -1 });
InventoryTransferSchema.index({ tenantId: 1, status: 1 });
