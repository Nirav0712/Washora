import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Purchase, PurchaseDocument } from '../../schemas/purchase.schema';
import { PurchaseItem, PurchaseItemDocument } from '../../schemas/purchase-item.schema';
import { Supplier, SupplierDocument } from '../../schemas/supplier.schema';
import { Branch, BranchDocument } from '../../schemas/branch.schema';
import { InventoryItem, InventoryItemDocument } from '../../schemas/inventory-item.schema';
import { SupplierPayment, SupplierPaymentDocument } from '../../schemas/supplier-payment.schema';
import { CounterService } from '../../common/services/counter.service';
import { AuditService } from '../audit/audit.service';
import { InventoryStockService } from '../inventory/inventory-stock.service';
import { CreatePurchaseDto, UpdatePurchaseDto } from './dto/create-purchase.dto';
import { PayPurchaseDto } from './dto/purchase-payment.dto';
import {
  PurchaseStatus,
  PurchasePaymentStatus,
  StockMovementType,
} from '@washora/shared';

@Injectable()
export class PurchasesService {
  private readonly logger = new Logger(PurchasesService.name);

  constructor(
    @InjectModel(Purchase.name)
    private purchaseModel: Model<PurchaseDocument>,
    @InjectModel(PurchaseItem.name)
    private purchaseItemModel: Model<PurchaseItemDocument>,
    @InjectModel(Supplier.name)
    private supplierModel: Model<SupplierDocument>,
    @InjectModel(Branch.name)
    private branchModel: Model<BranchDocument>,
    @InjectModel(InventoryItem.name)
    private inventoryItemModel: Model<InventoryItemDocument>,
    @InjectModel(SupplierPayment.name)
    private supplierPaymentModel: Model<SupplierPaymentDocument>,
    private counterService: CounterService,
    private auditService: AuditService,
    private stockService: InventoryStockService,
  ) {}

  // ==========================================
  // CREATE PURCHASE ORDER
  // ==========================================

  async create(tenantId: string, dto: CreatePurchaseDto, userId?: string): Promise<any> {
    if (!Types.ObjectId.isValid(dto.branchId) || !Types.ObjectId.isValid(dto.supplierId)) {
      throw new BadRequestException('Invalid branch or supplier ID');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Purchase must contain at least one item');
    }

    const [branch, supplier] = await Promise.all([
      this.branchModel.findOne({
        _id: new Types.ObjectId(dto.branchId),
        tenantId: new Types.ObjectId(tenantId),
      }).exec(),
      this.supplierModel.findOne({
        _id: new Types.ObjectId(dto.supplierId),
        tenantId: new Types.ObjectId(tenantId),
        isDeleted: { $ne: true },
      }).exec(),
    ]);

    if (!branch) throw new NotFoundException('Branch not found');
    if (!supplier) throw new NotFoundException('Supplier not found');

    const purchaseNumber = await this.counterService.generatePurchaseNumber(tenantId);

    // Calculate line items server-side
    let subtotal = 0;
    let totalTax = 0;
    const computedItems: Array<{
      inventoryItemId: Types.ObjectId;
      itemNameSnapshot: string;
      unit: any;
      quantity: number;
      unitCost: number;
      taxRate: number;
      taxAmount: number;
      lineTotal: number;
    }> = [];

    for (const itemDto of dto.items) {
      if (!Types.ObjectId.isValid(itemDto.inventoryItemId)) {
        throw new BadRequestException(`Invalid inventory item ID: ${itemDto.inventoryItemId}`);
      }

      const invItem = await this.inventoryItemModel.findOne({
        _id: new Types.ObjectId(itemDto.inventoryItemId),
        tenantId: new Types.ObjectId(tenantId),
        isDeleted: { $ne: true },
      }).exec();

      if (!invItem) {
        throw new NotFoundException(`Inventory item not found: ${itemDto.inventoryItemId}`);
      }

      const qty = Number(itemDto.quantity);
      const cost = Math.round(Number(itemDto.unitCost));
      const taxRate = Number(itemDto.taxRate) || 0;

      const itemSubtotal = Math.round(qty * cost);
      const itemTax = taxRate > 0 ? Math.round((itemSubtotal * taxRate) / 100) : 0;
      const lineTotal = itemSubtotal + itemTax;

      subtotal += itemSubtotal;
      totalTax += itemTax;

      computedItems.push({
        inventoryItemId: invItem._id,
        itemNameSnapshot: invItem.name,
        unit: invItem.unit,
        quantity: qty,
        unitCost: cost,
        taxRate,
        taxAmount: itemTax,
        lineTotal,
      });
    }

    const discount = Math.round(Number(dto.discount) || 0);
    const grandTotal = Math.max(0, subtotal + totalTax - discount);
    const initialStatus = dto.status || PurchaseStatus.ORDERED;

    const purchase = new this.purchaseModel({
      tenantId: new Types.ObjectId(tenantId),
      branchId: branch._id,
      supplierId: supplier._id,
      purchaseNumber,
      purchaseDate: dto.purchaseDate || new Date().toISOString().split('T')[0],
      subtotal,
      discount,
      tax: totalTax,
      grandTotal,
      paidAmount: 0,
      dueAmount: grandTotal,
      status: initialStatus,
      paymentStatus: PurchasePaymentStatus.UNPAID,
      notes: dto.notes,
      createdBy: userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined,
    });

    const savedPurchase = await purchase.save();

    // Create item rows
    const itemEntities = computedItems.map((ci) => ({
      tenantId: new Types.ObjectId(tenantId),
      purchaseId: savedPurchase._id,
      ...ci,
    }));
    await this.purchaseItemModel.insertMany(itemEntities);

    // Update supplier current balance (we owe more)
    supplier.currentBalance = (supplier.currentBalance || 0) + grandTotal;
    await supplier.save();

    // If marked received immediately, apply stock intake
    if (initialStatus === PurchaseStatus.RECEIVED) {
      savedPurchase.receivedAt = new Date();
      await savedPurchase.save();

      for (const item of computedItems) {
        await this.stockService.applyStockMovement({
          tenantId,
          branchId: branch._id.toString(),
          inventoryItemId: item.inventoryItemId.toString(),
          type: StockMovementType.PURCHASE_RECEIPT,
          quantity: item.quantity,
          unitCost: item.unitCost,
          referenceType: 'PURCHASE',
          referenceId: savedPurchase._id.toString(),
          reason: `PO Received: ${purchaseNumber}`,
          performedBy: userId,
        });
      }
    }

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      action: 'CREATE',
      entity: 'Purchase',
      entityId: savedPurchase._id.toString(),
      metadata: {
        purchaseNumber,
        supplierName: supplier.businessName,
        grandTotal,
        itemsCount: computedItems.length,
        status: initialStatus,
      },
    });

    return this.findOne(tenantId, savedPurchase._id.toString());
  }

  // ==========================================
  // FIND & QUERY PURCHASES
  // ==========================================

  async findAll(
    tenantId: string,
    query: {
      branchId?: string;
      supplierId?: string;
      status?: PurchaseStatus;
      paymentStatus?: PurchasePaymentStatus;
      startDate?: string;
      endDate?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ data: any[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      tenantId: new Types.ObjectId(tenantId),
    };

    if (query.branchId && Types.ObjectId.isValid(query.branchId)) {
      filter.branchId = new Types.ObjectId(query.branchId);
    }

    if (query.supplierId && Types.ObjectId.isValid(query.supplierId)) {
      filter.supplierId = new Types.ObjectId(query.supplierId);
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.paymentStatus) {
      filter.paymentStatus = query.paymentStatus;
    }

    if (query.startDate || query.endDate) {
      filter.purchaseDate = {};
      if (query.startDate) filter.purchaseDate.$gte = query.startDate;
      if (query.endDate) filter.purchaseDate.$lte = query.endDate;
    }

    if (query.search && query.search.trim()) {
      filter.purchaseNumber = new RegExp(query.search.trim(), 'i');
    }

    const [purchases, total] = await Promise.all([
      this.purchaseModel
        .find(filter)
        .populate('supplierId', 'businessName supplierCode phone')
        .populate('branchId', 'name code')
        .populate('createdBy', 'fullName email')
        .sort({ purchaseDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.purchaseModel.countDocuments(filter).exec(),
    ]);

    return {
      data: purchases,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(tenantId: string, id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid purchase ID format');
    }

    const purchase = await this.purchaseModel
      .findOne({
        _id: new Types.ObjectId(id),
        tenantId: new Types.ObjectId(tenantId),
      })
      .populate('supplierId', 'businessName supplierCode phone' as any)
      .populate('branchId', 'name code' as any)
      .populate('createdBy', 'fullName email' as any)
      .exec();

    if (!purchase) {
      throw new NotFoundException('Purchase order not found');
    }

    const items = await this.purchaseItemModel
      .find({
        purchaseId: purchase._id,
        tenantId: new Types.ObjectId(tenantId),
      })
      .populate('inventoryItemId', 'name inventoryCode unit currentStock')
      .exec();

    const payments = await this.supplierPaymentModel
      .find({
        purchaseId: purchase._id,
        tenantId: new Types.ObjectId(tenantId),
      })
      .exec();

    return {
      ...purchase.toObject(),
      items,
      payments,
    };
  }

  // ==========================================
  // RECEIVE PURCHASE ORDER
  // ==========================================

  async receive(tenantId: string, id: string, userId?: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid purchase ID format');
    }

    const purchase = await this.purchaseModel.findOne({
      _id: new Types.ObjectId(id),
      tenantId: new Types.ObjectId(tenantId),
    }).exec();

    if (!purchase) {
      throw new NotFoundException('Purchase order not found');
    }

    if (purchase.status === PurchaseStatus.RECEIVED) {
      throw new BadRequestException('Purchase order is already received');
    }

    if (purchase.status === PurchaseStatus.CANCELLED) {
      throw new BadRequestException('Cannot receive a cancelled purchase order');
    }

    const items = await this.purchaseItemModel.find({
      purchaseId: purchase._id,
      tenantId: new Types.ObjectId(tenantId),
    }).exec();

    // Increase stock for each purchase line item
    for (const item of items) {
      await this.stockService.applyStockMovement({
        tenantId,
        branchId: purchase.branchId.toString(),
        inventoryItemId: item.inventoryItemId.toString(),
        type: StockMovementType.PURCHASE_RECEIPT,
        quantity: item.quantity,
        unitCost: item.unitCost,
        referenceType: 'PURCHASE',
        referenceId: purchase._id.toString(),
        reason: `PO Received: ${purchase.purchaseNumber}`,
        performedBy: userId,
      });
    }

    purchase.status = PurchaseStatus.RECEIVED;
    purchase.receivedAt = new Date();
    await purchase.save();

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      action: 'PURCHASE_RECEIVED',
      entity: 'Purchase',
      entityId: id,
      metadata: { purchaseNumber: purchase.purchaseNumber, itemsCount: items.length },
    });

    return this.findOne(tenantId, id);
  }

  // ==========================================
  // CANCEL PURCHASE ORDER
  // ==========================================

  async cancel(tenantId: string, id: string, userId?: string): Promise<any> {
    const purchase = await this.purchaseModel.findOne({
      _id: new Types.ObjectId(id),
      tenantId: new Types.ObjectId(tenantId),
    }).exec();

    if (!purchase) {
      throw new NotFoundException('Purchase order not found');
    }

    if (purchase.status === PurchaseStatus.RECEIVED) {
      throw new BadRequestException('Cannot cancel an already received purchase order. Use stock adjustment instead.');
    }

    if (purchase.status === PurchaseStatus.CANCELLED) {
      throw new BadRequestException('Purchase order is already cancelled');
    }

    purchase.status = PurchaseStatus.CANCELLED;
    await purchase.save();

    // Reverse supplier balance
    const supplier = await this.supplierModel.findOne({
      _id: purchase.supplierId,
      tenantId: new Types.ObjectId(tenantId),
    }).exec();

    if (supplier) {
      supplier.currentBalance = Math.max(0, (supplier.currentBalance || 0) - purchase.grandTotal);
      await supplier.save();
    }

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      action: 'PURCHASE_CANCELLED',
      entity: 'Purchase',
      entityId: id,
      metadata: { purchaseNumber: purchase.purchaseNumber },
    });

    return this.findOne(tenantId, id);
  }

  // ==========================================
  // PAY PURCHASE ORDER
  // ==========================================

  async pay(tenantId: string, id: string, dto: PayPurchaseDto, userId?: string): Promise<any> {
    const purchase = await this.purchaseModel.findOne({
      _id: new Types.ObjectId(id),
      tenantId: new Types.ObjectId(tenantId),
    }).exec();

    if (!purchase) {
      throw new NotFoundException('Purchase order not found');
    }

    const payAmount = Math.round(Number(dto.amount));
    if (payAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    if (purchase.dueAmount <= 0) {
      throw new BadRequestException('Purchase order is already fully paid');
    }

    const paymentNumber = await this.counterService.generateSupplierPaymentNumber(tenantId);

    const payment = new this.supplierPaymentModel({
      tenantId: new Types.ObjectId(tenantId),
      branchId: purchase.branchId,
      supplierId: purchase.supplierId,
      purchaseId: purchase._id,
      paymentNumber,
      amount: payAmount,
      paymentMethod: dto.paymentMethod,
      referenceNumber: dto.referenceNumber,
      paymentDate: dto.paymentDate || new Date().toISOString().split('T')[0],
      notes: dto.notes,
      createdBy: userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined,
    });

    await payment.save();

    // Update purchase order totals & status
    purchase.paidAmount = (purchase.paidAmount || 0) + payAmount;
    purchase.dueAmount = Math.max(0, purchase.grandTotal - purchase.paidAmount);
    if (purchase.paidAmount >= purchase.grandTotal) {
      purchase.paymentStatus = PurchasePaymentStatus.PAID;
    } else {
      purchase.paymentStatus = PurchasePaymentStatus.PARTIALLY_PAID;
    }
    await purchase.save();

    // Update supplier current balance
    const supplier = await this.supplierModel.findOne({
      _id: purchase.supplierId,
      tenantId: new Types.ObjectId(tenantId),
    }).exec();

    if (supplier) {
      supplier.currentBalance = (supplier.currentBalance || 0) - payAmount;
      await supplier.save();
    }

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      action: 'PAY',
      entity: 'Purchase',
      entityId: id,
      metadata: {
        paymentNumber,
        amount: payAmount,
        paidAmount: purchase.paidAmount,
        dueAmount: purchase.dueAmount,
        paymentStatus: purchase.paymentStatus,
      },
    });

    return this.findOne(tenantId, id);
  }
}
