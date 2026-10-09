import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Supplier, SupplierDocument } from '../../schemas/supplier.schema';
import { SupplierPayment, SupplierPaymentDocument } from '../../schemas/supplier-payment.schema';
import { Purchase, PurchaseDocument } from '../../schemas/purchase.schema';
import { CounterService } from '../../common/services/counter.service';
import { AuditService } from '../audit/audit.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/create-supplier.dto';
import { RecordSupplierPaymentDto } from './dto/supplier-payment.dto';
import { PurchasePaymentStatus } from '@washora/shared';

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);

  constructor(
    @InjectModel(Supplier.name)
    private supplierModel: Model<SupplierDocument>,
    @InjectModel(SupplierPayment.name)
    private supplierPaymentModel: Model<SupplierPaymentDocument>,
    @InjectModel(Purchase.name)
    private purchaseModel: Model<PurchaseDocument>,
    private counterService: CounterService,
    private auditService: AuditService,
  ) {}

  // ==========================================
  // SUPPLIERS CRUD
  // ==========================================

  async create(tenantId: string, dto: CreateSupplierDto, userId?: string): Promise<SupplierDocument> {
    const supplierCode = await this.counterService.generateSupplierCode(tenantId);
    const openingBalance = Math.round(Number(dto.openingBalance) || 0);

    const supplier = new this.supplierModel({
      ...dto,
      supplierCode,
      tenantId: new Types.ObjectId(tenantId),
      openingBalance,
      currentBalance: openingBalance,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      isDeleted: false,
    });

    const saved = await supplier.save();

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      action: 'CREATE',
      entity: 'Supplier',
      entityId: saved._id.toString(),
      metadata: { supplierCode, businessName: saved.businessName, openingBalance },
    });

    return saved;
  }

  async findAll(
    tenantId: string,
    query: {
      search?: string;
      category?: string;
      isActive?: boolean;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ data: SupplierDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      tenantId: new Types.ObjectId(tenantId),
      isDeleted: { $ne: true },
    };

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.category) {
      filter.categories = query.category;
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { businessName: searchRegex },
        { supplierCode: searchRegex },
        { phone: searchRegex },
        { contactPerson: searchRegex },
        { email: searchRegex },
      ];
    }

    const [data, total] = await Promise.all([
      this.supplierModel.find(filter).sort({ businessName: 1 }).skip(skip).limit(limit).exec(),
      this.supplierModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(tenantId: string, id: string): Promise<SupplierDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid supplier ID format');
    }

    const supplier = await this.supplierModel
      .findOne({
        _id: new Types.ObjectId(id),
        tenantId: new Types.ObjectId(tenantId),
        isDeleted: { $ne: true },
      })
      .exec();

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return supplier;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateSupplierDto,
    userId?: string,
  ): Promise<SupplierDocument> {
    const supplier = await this.findOne(tenantId, id);

    const prevData = {
      businessName: supplier.businessName,
      phone: supplier.phone,
      isActive: supplier.isActive,
    };

    if (dto.businessName !== undefined) supplier.businessName = dto.businessName;
    if (dto.contactPerson !== undefined) supplier.contactPerson = dto.contactPerson;
    if (dto.phone !== undefined) supplier.phone = dto.phone;
    if (dto.alternatePhone !== undefined) supplier.alternatePhone = dto.alternatePhone;
    if (dto.email !== undefined) supplier.email = dto.email;
    if (dto.gstNumber !== undefined) supplier.gstNumber = dto.gstNumber;
    if (dto.address !== undefined) supplier.address = dto.address;
    if (dto.categories !== undefined) supplier.categories = dto.categories;
    if (dto.paymentTerms !== undefined) supplier.paymentTerms = dto.paymentTerms;
    if (dto.notes !== undefined) supplier.notes = dto.notes;
    if (dto.isActive !== undefined) supplier.isActive = dto.isActive;

    const updated = await supplier.save();

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      action: 'UPDATE',
      entity: 'Supplier',
      entityId: id,
      metadata: { previous: prevData, updated: dto },
    });

    return updated;
  }

  async remove(tenantId: string, id: string, userId?: string): Promise<{ success: boolean; message: string }> {
    const supplier = await this.findOne(tenantId, id);

    supplier.isDeleted = true;
    supplier.isActive = false;
    await supplier.save();

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      action: 'DELETE',
      entity: 'Supplier',
      entityId: id,
      metadata: { supplierCode: supplier.supplierCode, businessName: supplier.businessName },
    });

    return { success: true, message: 'Supplier deleted successfully' };
  }

  // ==========================================
  // SUPPLIER PAYMENTS
  // ==========================================

  async recordPayment(
    tenantId: string,
    dto: RecordSupplierPaymentDto,
    userId?: string,
  ): Promise<SupplierPaymentDocument> {
    const supplier = await this.findOne(tenantId, dto.supplierId);

    const paymentNumber = await this.counterService.generateSupplierPaymentNumber(tenantId);
    const amount = Math.round(Number(dto.amount));

    if (amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    const payment = new this.supplierPaymentModel({
      tenantId: new Types.ObjectId(tenantId),
      supplierId: supplier._id,
      branchId: dto.branchId && Types.ObjectId.isValid(dto.branchId) ? new Types.ObjectId(dto.branchId) : undefined,
      purchaseId: dto.purchaseId && Types.ObjectId.isValid(dto.purchaseId) ? new Types.ObjectId(dto.purchaseId) : undefined,
      paymentNumber,
      amount,
      paymentMethod: dto.paymentMethod,
      referenceNumber: dto.referenceNumber,
      paymentDate: dto.paymentDate || new Date().toISOString().split('T')[0],
      notes: dto.notes,
      createdBy: userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined,
    });

    const savedPayment = await payment.save();

    // Update supplier current balance (reducing what we owe)
    supplier.currentBalance = (supplier.currentBalance || 0) - amount;
    await supplier.save();

    // If linked to a purchase order, update purchase paid amount & payment status
    if (dto.purchaseId && Types.ObjectId.isValid(dto.purchaseId)) {
      const purchase = await this.purchaseModel.findOne({
        _id: new Types.ObjectId(dto.purchaseId),
        tenantId: new Types.ObjectId(tenantId),
      }).exec();

      if (purchase) {
        purchase.paidAmount = (purchase.paidAmount || 0) + amount;
        purchase.dueAmount = Math.max(0, purchase.grandTotal - purchase.paidAmount);
        if (purchase.paidAmount >= purchase.grandTotal) {
          purchase.paymentStatus = PurchasePaymentStatus.PAID;
        } else if (purchase.paidAmount > 0) {
          purchase.paymentStatus = PurchasePaymentStatus.PARTIALLY_PAID;
        }
        await purchase.save();
      }
    }

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      action: 'PAY',
      entity: 'SupplierPayment',
      entityId: savedPayment._id.toString(),
      metadata: {
        paymentNumber,
        supplierId: supplier._id.toString(),
        supplierName: supplier.businessName,
        amount,
        paymentMethod: dto.paymentMethod,
      },
    });

    return savedPayment;
  }

  async findPayments(
    tenantId: string,
    query: {
      supplierId?: string;
      branchId?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ data: SupplierPaymentDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      tenantId: new Types.ObjectId(tenantId),
    };

    if (query.supplierId && Types.ObjectId.isValid(query.supplierId)) {
      filter.supplierId = new Types.ObjectId(query.supplierId);
    }

    if (query.branchId && Types.ObjectId.isValid(query.branchId)) {
      filter.branchId = new Types.ObjectId(query.branchId);
    }

    if (query.startDate || query.endDate) {
      filter.paymentDate = {};
      if (query.startDate) filter.paymentDate.$gte = query.startDate;
      if (query.endDate) filter.paymentDate.$lte = query.endDate;
    }

    const [data, total] = await Promise.all([
      this.supplierPaymentModel
        .find(filter)
        .populate('supplierId', 'businessName supplierCode phone')
        .populate('branchId', 'name code')
        .sort({ paymentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.supplierPaymentModel.countDocuments(filter).exec(),
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
  // SUPPLIER LEDGER & RECALCULATION
  // ==========================================

  async getLedger(tenantId: string, supplierId: string): Promise<any> {
    const supplier = await this.findOne(tenantId, supplierId);

    const [purchases, payments] = await Promise.all([
      this.purchaseModel
        .find({
          tenantId: new Types.ObjectId(tenantId),
          supplierId: new Types.ObjectId(supplierId),
        })
        .sort({ purchaseDate: 1 })
        .exec(),
      this.supplierPaymentModel
        .find({
          tenantId: new Types.ObjectId(tenantId),
          supplierId: new Types.ObjectId(supplierId),
        })
        .sort({ paymentDate: 1 })
        .exec(),
    ]);

    const transactions = [];

    // Add opening balance
    if (supplier.openingBalance) {
      transactions.push({
        type: 'OPENING_BALANCE',
        date: supplier['createdAt'] ? supplier['createdAt'].toISOString().split('T')[0] : 'Opening',
        reference: 'OPENING',
        description: 'Opening Balance',
        debit: supplier.openingBalance > 0 ? supplier.openingBalance : 0,
        credit: supplier.openingBalance < 0 ? Math.abs(supplier.openingBalance) : 0,
        balance: supplier.openingBalance,
      });
    }

    for (const p of purchases) {
      transactions.push({
        type: 'PURCHASE',
        date: p.purchaseDate,
        reference: p.purchaseNumber,
        description: `Purchase Order - ${p.status}`,
        debit: p.grandTotal,
        credit: 0,
        id: p._id,
      });
    }

    for (const pay of payments) {
      transactions.push({
        type: 'PAYMENT',
        date: pay.paymentDate,
        reference: pay.paymentNumber,
        description: `Payment via ${pay.paymentMethod} ${pay.referenceNumber ? `(${pay.referenceNumber})` : ''}`,
        debit: 0,
        credit: pay.amount,
        id: pay._id,
      });
    }

    // Sort chronologically
    transactions.sort((a, b) => (a.date > b.date ? 1 : -1));

    // Calculate running balance
    let runningBalance = 0;
    const computedTransactions = transactions.map((tx) => {
      runningBalance += tx.debit - tx.credit;
      return {
        ...tx,
        balance: runningBalance,
      };
    });

    return {
      supplier,
      openingBalance: supplier.openingBalance,
      currentBalance: supplier.currentBalance,
      calculatedBalance: runningBalance,
      totalPurchases: purchases.reduce((acc, curr) => acc + (curr.grandTotal || 0), 0),
      totalPayments: payments.reduce((acc, curr) => acc + (curr.amount || 0), 0),
      transactions: computedTransactions,
    };
  }

  async recalculateBalance(tenantId: string, supplierId: string): Promise<number> {
    const supplier = await this.findOne(tenantId, supplierId);

    const [purchases, payments] = await Promise.all([
      this.purchaseModel
        .find({
          tenantId: new Types.ObjectId(tenantId),
          supplierId: new Types.ObjectId(supplierId),
          status: { $ne: 'CANCELLED' },
        })
        .exec(),
      this.supplierPaymentModel
        .find({
          tenantId: new Types.ObjectId(tenantId),
          supplierId: new Types.ObjectId(supplierId),
        })
        .exec(),
    ]);

    const totalPurchases = purchases.reduce((acc, curr) => acc + (curr.grandTotal || 0), 0);
    const totalPayments = payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const calculatedBalance = (supplier.openingBalance || 0) + totalPurchases - totalPayments;
    supplier.currentBalance = calculatedBalance;
    await supplier.save();

    return calculatedBalance;
  }
}
