import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InventoryItem, InventoryItemDocument } from '../../schemas/inventory-item.schema';
import { InventoryCategory, InventoryCategoryDocument } from '../../schemas/inventory-category.schema';
import { StockMovement, StockMovementDocument } from '../../schemas/stock-movement.schema';
import { InventoryTransfer, InventoryTransferDocument } from '../../schemas/inventory-transfer.schema';
import { Branch, BranchDocument } from '../../schemas/branch.schema';
import { CounterService } from '../../common/services/counter.service';
import { AuditService } from '../audit/audit.service';
import { InventoryStockService } from './inventory-stock.service';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
} from './dto/create-inventory.dto';
import {
  CreateInventoryCategoryDto,
  UpdateInventoryCategoryDto,
} from './dto/inventory-category.dto';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';
import {
  RequestInventoryTransferDto,
  CompleteInventoryTransferDto,
} from './dto/inventory-transfer.dto';
import {
  DEFAULT_INVENTORY_CATEGORIES,
  StockMovementType,
  TransferStatus,
} from '@washora/shared';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectModel(InventoryItem.name)
    private itemModel: Model<InventoryItemDocument>,
    @InjectModel(InventoryCategory.name)
    private categoryModel: Model<InventoryCategoryDocument>,
    @InjectModel(StockMovement.name)
    private stockMovementModel: Model<StockMovementDocument>,
    @InjectModel(InventoryTransfer.name)
    private transferModel: Model<InventoryTransferDocument>,
    @InjectModel(Branch.name)
    private branchModel: Model<BranchDocument>,
    private counterService: CounterService,
    private auditService: AuditService,
    private stockService: InventoryStockService,
  ) {}

  // ==========================================
  // INVENTORY CATEGORIES
  // ==========================================

  async seedDefaultCategories(tenantId: string): Promise<void> {
    const count = await this.categoryModel.countDocuments({
      tenantId: new Types.ObjectId(tenantId),
    }).exec();

    if (count === 0) {
      const defaults = DEFAULT_INVENTORY_CATEGORIES.map((cat) => ({
        tenantId: new Types.ObjectId(tenantId),
        name: cat.name,
        code: cat.code,
        description: cat.description,
        isActive: true,
      }));
      await this.categoryModel.insertMany(defaults);
      this.logger.log(`Seeded ${defaults.length} default inventory categories for tenant ${tenantId}`);
    }
  }

  async findCategories(tenantId: string): Promise<InventoryCategoryDocument[]> {
    await this.seedDefaultCategories(tenantId);
    return this.categoryModel
      .find({
        tenantId: new Types.ObjectId(tenantId),
        isActive: true,
      })
      .sort({ name: 1 })
      .exec();
  }

  async createCategory(
    tenantId: string,
    dto: CreateInventoryCategoryDto,
    userId?: string,
  ): Promise<InventoryCategoryDocument> {
    const existing = await this.categoryModel.findOne({
      tenantId: new Types.ObjectId(tenantId),
      name: { $regex: new RegExp(`^${dto.name.trim()}$`, 'i') },
    }).exec();

    if (existing) {
      throw new ConflictException(`Inventory category '${dto.name}' already exists`);
    }

    const category = new this.categoryModel({
      ...dto,
      tenantId: new Types.ObjectId(tenantId),
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    const saved = await category.save();

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      action: 'CREATE',
      entity: 'InventoryCategory',
      entityId: saved._id.toString(),
      metadata: { name: saved.name },
    });

    return saved;
  }

  async updateCategory(
    tenantId: string,
    id: string,
    dto: UpdateInventoryCategoryDto,
    userId?: string,
  ): Promise<InventoryCategoryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID format');
    }

    const category = await this.categoryModel.findOne({
      _id: new Types.ObjectId(id),
      tenantId: new Types.ObjectId(tenantId),
    }).exec();

    if (!category) {
      throw new NotFoundException('Inventory category not found');
    }

    if (dto.name !== undefined) category.name = dto.name;
    if (dto.description !== undefined) category.description = dto.description;
    if (dto.isActive !== undefined) category.isActive = dto.isActive;

    const saved = await category.save();

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      action: 'UPDATE',
      entity: 'InventoryCategory',
      entityId: id,
      metadata: { name: saved.name },
    });

    return saved;
  }

  // ==========================================
  // INVENTORY ITEMS
  // ==========================================

  async createItem(
    tenantId: string,
    dto: CreateInventoryItemDto,
    userId?: string,
  ): Promise<InventoryItemDocument> {
    if (!Types.ObjectId.isValid(dto.categoryId)) {
      throw new BadRequestException('Invalid category ID');
    }

    const category = await this.categoryModel.findOne({
      _id: new Types.ObjectId(dto.categoryId),
      tenantId: new Types.ObjectId(tenantId),
    }).exec();

    if (!category) {
      throw new NotFoundException('Inventory category not found');
    }

    let branchObjectId: Types.ObjectId | undefined;
    if (dto.branchId) {
      if (!Types.ObjectId.isValid(dto.branchId)) {
        throw new BadRequestException('Invalid branch ID format');
      }
      const branch = await this.branchModel.findOne({
        _id: new Types.ObjectId(dto.branchId),
        tenantId: new Types.ObjectId(tenantId),
      }).exec();
      if (!branch) {
        throw new NotFoundException('Branch not found');
      }
      branchObjectId = branch._id;
    }

    const inventoryCode = await this.counterService.generateInventoryCode(tenantId);
    const initialStock = Number(dto.initialStock) || 0;
    const unitCost = Math.round(Number(dto.unitCost) || 0);

    const item = new this.itemModel({
      tenantId: new Types.ObjectId(tenantId),
      branchId: branchObjectId,
      inventoryCode,
      categoryId: category._id,
      name: dto.name.trim(),
      description: dto.description,
      unit: dto.unit,
      currentStock: 0,
      reservedStock: 0,
      minimumStock: Number(dto.minimumStock) || 0,
      reorderLevel: Number(dto.reorderLevel) || 0,
      averageCost: unitCost,
      lastPurchaseCost: unitCost,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      isDeleted: false,
    });

    const saved = await item.save();

    if (initialStock > 0) {
      await this.stockService.applyStockMovement({
        tenantId,
        branchId: branchObjectId?.toString(),
        inventoryItemId: saved._id.toString(),
        type: StockMovementType.INITIAL_STOCK,
        quantity: initialStock,
        unitCost,
        reason: 'Initial opening stock',
        performedBy: userId,
      });
    }

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      action: 'CREATE',
      entity: 'InventoryItem',
      entityId: saved._id.toString(),
      metadata: { inventoryCode, name: saved.name, initialStock, unitCost },
    });

    return (await this.findOneItem(tenantId, saved._id.toString())) as InventoryItemDocument;
  }

  async findItems(
    tenantId: string,
    query: {
      branchId?: string;
      categoryId?: string;
      search?: string;
      lowStockOnly?: boolean;
      isActive?: boolean;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ data: InventoryItemDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      tenantId: new Types.ObjectId(tenantId),
      isDeleted: { $ne: true },
    };

    if (query.branchId && Types.ObjectId.isValid(query.branchId)) {
      filter.branchId = new Types.ObjectId(query.branchId);
    }

    if (query.categoryId && Types.ObjectId.isValid(query.categoryId)) {
      filter.categoryId = new Types.ObjectId(query.categoryId);
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { inventoryCode: searchRegex },
        { description: searchRegex },
      ];
    }

    if (query.lowStockOnly) {
      filter.$expr = { $lte: ['$currentStock', '$reorderLevel'] };
    }

    const [data, total] = await Promise.all([
      this.itemModel
        .find(filter)
        .populate('categoryId', 'name')
        .populate('branchId', 'name code')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.itemModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOneItem(tenantId: string, id: string): Promise<InventoryItemDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid item ID format');
    }

    const item = await this.itemModel
      .findOne({
        _id: new Types.ObjectId(id),
        tenantId: new Types.ObjectId(tenantId),
        isDeleted: { $ne: true },
      })
      .populate('categoryId', 'name')
      .populate('branchId', 'name code')
      .exec();

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    return item;
  }

  async updateItem(
    tenantId: string,
    id: string,
    dto: UpdateInventoryItemDto,
    userId?: string,
  ): Promise<InventoryItemDocument> {
    const item = await this.findOneItem(tenantId, id);

    if (dto.categoryId && Types.ObjectId.isValid(dto.categoryId)) {
      item.categoryId = new Types.ObjectId(dto.categoryId);
    }
    if (dto.name !== undefined) item.name = dto.name.trim();
    if (dto.description !== undefined) item.description = dto.description;
    if (dto.unit !== undefined) item.unit = dto.unit;
    if (dto.minimumStock !== undefined) item.minimumStock = Number(dto.minimumStock);
    if (dto.reorderLevel !== undefined) item.reorderLevel = Number(dto.reorderLevel);
    if (dto.isActive !== undefined) item.isActive = dto.isActive;

    const saved = await item.save();

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      action: 'UPDATE',
      entity: 'InventoryItem',
      entityId: id,
      metadata: { name: saved.name, updated: dto },
    });

    return (await this.findOneItem(tenantId, id)) as InventoryItemDocument;
  }

  async deleteItem(tenantId: string, id: string, userId?: string): Promise<{ success: boolean; message: string }> {
    const item = await this.findOneItem(tenantId, id);

    item.isDeleted = true;
    item.isActive = false;
    await item.save();

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      action: 'DELETE',
      entity: 'InventoryItem',
      entityId: id,
      metadata: { inventoryCode: item.inventoryCode, name: item.name },
    });

    return { success: true, message: 'Inventory item deleted successfully' };
  }

  // ==========================================
  // STOCK ADJUSTMENTS & MOVEMENTS
  // ==========================================

  async adjustStock(
    tenantId: string,
    dto: StockAdjustmentDto,
    userId?: string,
  ): Promise<{ item: InventoryItemDocument; movement: StockMovementDocument }> {
    const result = await this.stockService.applyStockMovement({
      tenantId,
      inventoryItemId: dto.inventoryItemId,
      type: dto.type || StockMovementType.MANUAL_ADJUSTMENT,
      quantity: dto.quantity,
      unitCost: dto.unitCost,
      referenceType: dto.referenceType || 'MANUAL',
      referenceId: dto.referenceId,
      reason: dto.reason,
      performedBy: userId,
    });

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      action: 'STOCK_ADJUSTMENT',
      entity: 'InventoryItem',
      entityId: dto.inventoryItemId,
      metadata: {
        type: dto.type,
        quantity: dto.quantity,
        beforeQuantity: result.movement.beforeQuantity,
        afterQuantity: result.movement.afterQuantity,
        reason: dto.reason,
      },
    });

    return result;
  }

  async findStockMovements(
    tenantId: string,
    query: {
      inventoryItemId?: string;
      branchId?: string;
      type?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ data: StockMovementDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      tenantId: new Types.ObjectId(tenantId),
    };

    if (query.inventoryItemId && Types.ObjectId.isValid(query.inventoryItemId)) {
      filter.inventoryItemId = new Types.ObjectId(query.inventoryItemId);
    }

    if (query.branchId && Types.ObjectId.isValid(query.branchId)) {
      filter.branchId = new Types.ObjectId(query.branchId);
    }

    if (query.type) {
      filter.type = query.type;
    }

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const [data, total] = await Promise.all([
      this.stockMovementModel
        .find(filter)
        .populate('inventoryItemId', 'name inventoryCode unit')
        .populate('branchId', 'name code')
        .populate('performedBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.stockMovementModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  // ==========================================
  // INVENTORY TRANSFERS
  // ==========================================

  async requestTransfer(
    tenantId: string,
    dto: RequestInventoryTransferDto,
    userId?: string,
  ): Promise<InventoryTransferDocument> {
    if (!Types.ObjectId.isValid(dto.fromBranchId) || !Types.ObjectId.isValid(dto.toBranchId)) {
      throw new BadRequestException('Invalid branch IDs');
    }

    if (dto.fromBranchId === dto.toBranchId) {
      throw new BadRequestException('Source and destination branches cannot be the same');
    }

    const sourceItem = await this.findOneItem(tenantId, dto.inventoryItemId);
    if (sourceItem.currentStock < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock at source branch. Available: ${sourceItem.currentStock}, Requested: ${dto.quantity}`,
      );
    }

    const transfer = new this.transferModel({
      tenantId: new Types.ObjectId(tenantId),
      fromBranchId: new Types.ObjectId(dto.fromBranchId),
      toBranchId: new Types.ObjectId(dto.toBranchId),
      inventoryItemId: sourceItem._id,
      quantity: Number(dto.quantity),
      status: TransferStatus.PENDING,
      requestedBy: userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined,
      notes: dto.notes,
    });

    const saved = await transfer.save();

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      action: 'TRANSFER_REQUESTED',
      entity: 'InventoryTransfer',
      entityId: saved._id.toString(),
      metadata: {
        fromBranchId: dto.fromBranchId,
        toBranchId: dto.toBranchId,
        inventoryItemId: dto.inventoryItemId,
        quantity: dto.quantity,
      },
    });

    return saved;
  }

  async completeTransfer(
    tenantId: string,
    id: string,
    dto: CompleteInventoryTransferDto,
    userId?: string,
  ): Promise<InventoryTransferDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transfer ID format');
    }

    const transfer = await this.transferModel.findOne({
      _id: new Types.ObjectId(id),
      tenantId: new Types.ObjectId(tenantId),
    }).exec();

    if (!transfer) {
      throw new NotFoundException('Inventory transfer not found');
    }

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException(`Cannot complete transfer in ${transfer.status} status`);
    }

    const sourceItem = await this.findOneItem(tenantId, transfer.inventoryItemId.toString());

    // 1. Deduct stock from source item
    await this.stockService.applyStockMovement({
      tenantId,
      branchId: transfer.fromBranchId.toString(),
      inventoryItemId: sourceItem._id.toString(),
      type: StockMovementType.TRANSFER_OUT,
      quantity: -transfer.quantity,
      referenceType: 'TRANSFER',
      referenceId: transfer._id.toString(),
      reason: `Transfer to destination branch (ID: ${transfer.toBranchId})`,
      performedBy: userId,
    });

    // 2. Find or create corresponding item at destination branch
    let destItem = await this.itemModel.findOne({
      tenantId: new Types.ObjectId(tenantId),
      branchId: transfer.toBranchId,
      name: sourceItem.name,
      isDeleted: { $ne: true },
    }).exec();

    if (!destItem) {
      const code = await this.counterService.generateInventoryCode(tenantId);
      destItem = new this.itemModel({
        tenantId: new Types.ObjectId(tenantId),
        branchId: transfer.toBranchId,
        inventoryCode: code,
        categoryId: (sourceItem.categoryId as any)?._id || sourceItem.categoryId,
        name: sourceItem.name,
        description: sourceItem.description,
        unit: sourceItem.unit,
        currentStock: 0,
        reservedStock: 0,
        minimumStock: sourceItem.minimumStock,
        reorderLevel: sourceItem.reorderLevel,
        averageCost: sourceItem.averageCost,
        lastPurchaseCost: sourceItem.lastPurchaseCost,
        isActive: true,
        isDeleted: false,
      });
      await destItem.save();
    }

    // 3. Add stock to destination item
    await this.stockService.applyStockMovement({
      tenantId,
      branchId: transfer.toBranchId.toString(),
      inventoryItemId: destItem._id.toString(),
      type: StockMovementType.TRANSFER_IN,
      quantity: transfer.quantity,
      unitCost: sourceItem.averageCost,
      referenceType: 'TRANSFER',
      referenceId: transfer._id.toString(),
      reason: `Transfer from source branch (ID: ${transfer.fromBranchId})`,
      performedBy: userId,
    });

    transfer.status = TransferStatus.COMPLETED;
    transfer.approvedBy = userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined;
    transfer.completedAt = new Date();
    if (dto.notes) transfer.notes = `${transfer.notes ? transfer.notes + ' | ' : ''}${dto.notes}`;

    const saved = await transfer.save();

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      action: 'TRANSFER_COMPLETED',
      entity: 'InventoryTransfer',
      entityId: id,
      metadata: {
        fromBranchId: transfer.fromBranchId.toString(),
        toBranchId: transfer.toBranchId.toString(),
        quantity: transfer.quantity,
      },
    });

    return saved;
  }

  async cancelTransfer(
    tenantId: string,
    id: string,
    userId?: string,
  ): Promise<InventoryTransferDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transfer ID format');
    }

    const transfer = await this.transferModel.findOne({
      _id: new Types.ObjectId(id),
      tenantId: new Types.ObjectId(tenantId),
    }).exec();

    if (!transfer) {
      throw new NotFoundException('Inventory transfer not found');
    }

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException(`Cannot cancel transfer in ${transfer.status} status`);
    }

    transfer.status = TransferStatus.CANCELLED;
    const saved = await transfer.save();

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      action: 'TRANSFER_CANCELLED',
      entity: 'InventoryTransfer',
      entityId: id,
      metadata: { status: TransferStatus.CANCELLED },
    });

    return saved;
  }

  async findTransfers(
    tenantId: string,
    query: {
      fromBranchId?: string;
      toBranchId?: string;
      status?: TransferStatus;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ data: InventoryTransferDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      tenantId: new Types.ObjectId(tenantId),
    };

    if (query.fromBranchId && Types.ObjectId.isValid(query.fromBranchId)) {
      filter.fromBranchId = new Types.ObjectId(query.fromBranchId);
    }

    if (query.toBranchId && Types.ObjectId.isValid(query.toBranchId)) {
      filter.toBranchId = new Types.ObjectId(query.toBranchId);
    }

    if (query.status) {
      filter.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.transferModel
        .find(filter)
        .populate('fromBranchId', 'name code')
        .populate('toBranchId', 'name code')
        .populate('inventoryItemId', 'name inventoryCode unit')
        .populate('requestedBy', 'fullName email')
        .populate('approvedBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.transferModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  // ==========================================
  // VALUATION & SUMMARY
  // ==========================================

  async getInventoryValuation(tenantId: string, branchId?: string): Promise<any> {
    const filter: Record<string, any> = {
      tenantId: new Types.ObjectId(tenantId),
      isDeleted: { $ne: true },
      isActive: true,
    };

    if (branchId && Types.ObjectId.isValid(branchId)) {
      filter.branchId = new Types.ObjectId(branchId);
    }

    const items = await this.itemModel.find(filter).exec();

    let totalValuation = 0;
    let totalItemsCount = items.length;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const itemsSummary = items.map((item) => {
      const stockVal = Math.round((item.currentStock || 0) * (item.averageCost || 0));
      totalValuation += stockVal;

      if (item.currentStock <= 0) {
        outOfStockCount++;
      } else if (item.currentStock <= (item.reorderLevel || 0)) {
        lowStockCount++;
      }

      return {
        id: item._id,
        inventoryCode: item.inventoryCode,
        name: item.name,
        currentStock: item.currentStock,
        unit: item.unit,
        averageCost: item.averageCost,
        totalValue: stockVal,
        isLowStock: item.currentStock <= (item.reorderLevel || 0),
      };
    });

    return {
      totalValuation,
      totalItemsCount,
      lowStockCount,
      outOfStockCount,
      items: itemsSummary,
    };
  }
}
