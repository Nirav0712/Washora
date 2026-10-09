import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InventoryItem, InventoryItemDocument } from '../../schemas/inventory-item.schema';
import { StockMovement, StockMovementDocument } from '../../schemas/stock-movement.schema';
import { StockMovementType } from '@washora/shared';

export interface ApplyStockMovementParams {
  tenantId: string;
  branchId?: string;
  inventoryItemId: string;
  type: StockMovementType;
  quantity: number; // positive (add) or negative (deduct)
  unitCost?: number; // in cents/paise (for incoming stock)
  referenceType?: string;
  referenceId?: string;
  reason?: string;
  performedBy?: string;
}

@Injectable()
export class InventoryStockService {
  private readonly logger = new Logger(InventoryStockService.name);

  constructor(
    @InjectModel(InventoryItem.name)
    private inventoryItemModel: Model<InventoryItemDocument>,
    @InjectModel(StockMovement.name)
    private stockMovementModel: Model<StockMovementDocument>,
  ) {}

  /**
   * Centralized atomic stock mutation engine.
   * Ensures every stock modification creates a detailed StockMovement record
   * and updates weighted average cost correctly.
   */
  async applyStockMovement(params: ApplyStockMovementParams): Promise<{
    item: InventoryItemDocument;
    movement: StockMovementDocument;
  }> {
    const {
      tenantId,
      branchId,
      inventoryItemId,
      type,
      quantity,
      unitCost,
      referenceType,
      referenceId,
      reason,
      performedBy,
    } = params;

    if (!Types.ObjectId.isValid(inventoryItemId)) {
      throw new BadRequestException('Invalid inventory item ID');
    }

    const item = await this.inventoryItemModel.findOne({
      _id: new Types.ObjectId(inventoryItemId),
      tenantId: new Types.ObjectId(tenantId),
      isDeleted: { $ne: true },
    }).exec();

    if (!item) {
      throw new BadRequestException('Inventory item not found');
    }

    const beforeQuantity = item.currentStock || 0;
    const delta = Number(quantity);

    if (delta < 0 && beforeQuantity + delta < 0) {
      throw new BadRequestException(
        `Insufficient stock for item ${item.name}. Available: ${beforeQuantity}, Requested deduction: ${Math.abs(delta)}`,
      );
    }

    const afterQuantity = Math.max(0, beforeQuantity + delta);

    // Cost calculations
    const cost = Math.round(Number(unitCost) || 0);
    if (delta > 0 && cost > 0) {
      // Weighted average cost formula:
      // newAvg = ((currentStock * currentAvg) + (newQty * newCost)) / (currentStock + newQty)
      const currentAvg = item.averageCost || 0;
      const totalOldVal = beforeQuantity * currentAvg;
      const totalNewVal = delta * cost;
      const totalQty = beforeQuantity + delta;

      if (totalQty > 0) {
        item.averageCost = Math.round((totalOldVal + totalNewVal) / totalQty);
      } else {
        item.averageCost = cost;
      }

      item.lastPurchaseCost = cost;
    }

    item.currentStock = afterQuantity;
    const savedItem = await item.save();

    // Create immutable stock movement record
    const movement = new this.stockMovementModel({
      tenantId: new Types.ObjectId(tenantId),
      branchId: branchId && Types.ObjectId.isValid(branchId) ? new Types.ObjectId(branchId) : (item.branchId || new Types.ObjectId()),
      inventoryItemId: item._id,
      type,
      quantity: delta,
      beforeQuantity,
      afterQuantity,
      unitCost: cost || item.averageCost || 0,
      referenceType,
      referenceId,
      reason,
      performedBy: performedBy && Types.ObjectId.isValid(performedBy) ? new Types.ObjectId(performedBy) : undefined,
    });

    const savedMovement = await movement.save();

    this.logger.log(
      `Stock updated for ${item.name} (${item.inventoryCode}): ${beforeQuantity} -> ${afterQuantity} (delta: ${delta}, type: ${type})`,
    );

    return { item: savedItem, movement: savedMovement };
  }
}
