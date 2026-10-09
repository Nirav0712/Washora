import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Expense, ExpenseDocument } from '../../schemas/expense.schema';
import { ExpenseCategory, ExpenseCategoryDocument } from '../../schemas/expense-category.schema';
import { Branch, BranchDocument } from '../../schemas/branch.schema';
import { Supplier, SupplierDocument } from '../../schemas/supplier.schema';
import { CounterService } from '../../common/services/counter.service';
import { AuditService } from '../audit/audit.service';
import {
  ExpenseStatus,
  ExpensePaymentMethod,
  DEFAULT_EXPENSE_CATEGORIES,
} from '@washora/shared';
import { CreateExpenseDto, UpdateExpenseDto, RejectExpenseDto, PayExpenseDto } from './dto/create-expense.dto';
import { CreateExpenseCategoryDto, UpdateExpenseCategoryDto } from './dto/expense-category.dto';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(
    @InjectModel(Expense.name)
    private expenseModel: Model<ExpenseDocument>,
    @InjectModel(ExpenseCategory.name)
    private categoryModel: Model<ExpenseCategoryDocument>,
    @InjectModel(Branch.name)
    private branchModel: Model<BranchDocument>,
    @InjectModel(Supplier.name)
    private supplierModel: Model<SupplierDocument>,
    private counterService: CounterService,
    private auditService: AuditService,
  ) {}

  // ==========================================
  // EXPENSE CATEGORIES
  // ==========================================

  async getCategories(tenantId: string | Types.ObjectId): Promise<ExpenseCategoryDocument[]> {
    const tId = new Types.ObjectId(tenantId.toString());
    await this.seedDefaultCategories(tId);
    return this.categoryModel.find({ tenantId: tId, isActive: true }).sort({ name: 1 }).exec();
  }

  async seedDefaultCategories(tenantId: Types.ObjectId): Promise<void> {
    const count = await this.categoryModel.countDocuments({ tenantId }).exec();
    if (count === 0) {
      const defaultDocs = DEFAULT_EXPENSE_CATEGORIES.map((cat) => ({
        tenantId,
        name: cat.name,
        code: cat.code,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        isActive: true,
      }));
      await this.categoryModel.insertMany(defaultDocs);
      this.logger.log(`Seeded ${defaultDocs.length} default expense categories for tenant ${tenantId}`);
    }
  }

  async createCategory(
    tenantId: string | Types.ObjectId,
    dto: CreateExpenseCategoryDto,
  ): Promise<ExpenseCategoryDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const existing = await this.categoryModel.findOne({
      tenantId: tId,
      code: dto.code.toUpperCase().trim(),
    }).exec();

    if (existing) {
      throw new ConflictException(`Expense category with code "${dto.code}" already exists`);
    }

    const cat = new this.categoryModel({
      tenantId: tId,
      name: dto.name.trim(),
      code: dto.code.toUpperCase().trim(),
      description: dto.description?.trim(),
      icon: dto.icon || 'MoreHorizontal',
      color: dto.color || '#6366F1',
      isActive: true,
    });

    return cat.save();
  }

  async updateCategory(
    tenantId: string | Types.ObjectId,
    id: string,
    dto: UpdateExpenseCategoryDto,
  ): Promise<ExpenseCategoryDocument> {
    if (!id || !Types.ObjectId.isValid(id.toString())) {
      throw new NotFoundException(`Expense category ${id} not found`);
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const cat = await this.categoryModel.findOne({ _id: new Types.ObjectId(id), tenantId: tId }).exec();
    if (!cat) {
      throw new NotFoundException(`Expense category ${id} not found`);
    }

    if (dto.name !== undefined) cat.name = dto.name.trim();
    if (dto.description !== undefined) cat.description = dto.description.trim();
    if (dto.icon !== undefined) cat.icon = dto.icon;
    if (dto.color !== undefined) cat.color = dto.color;
    if (dto.isActive !== undefined) cat.isActive = dto.isActive;

    return cat.save();
  }

  // ==========================================
  // EXPENSES
  // ==========================================

  async create(
    tenantId: string | Types.ObjectId,
    dto: CreateExpenseDto,
    actorUserId?: string,
  ): Promise<ExpenseDocument> {
    const tId = new Types.ObjectId(tenantId.toString());

    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException('Expense amount must be greater than zero');
    }

    if (!dto.categoryId || !Types.ObjectId.isValid(dto.categoryId.toString())) {
      throw new NotFoundException('Valid category ID is required');
    }
    const category = await this.categoryModel.findOne({
      _id: new Types.ObjectId(dto.categoryId),
      tenantId: tId,
    }).exec();
    if (!category) {
      throw new NotFoundException(`Category ${dto.categoryId} not found in tenant`);
    }

    let branchObjectId: Types.ObjectId | undefined;
    if (dto.branchId) {
      if (!Types.ObjectId.isValid(dto.branchId.toString())) {
        throw new NotFoundException(`Branch ${dto.branchId} not found`);
      }
      const branch = await this.branchModel.findOne({
        _id: new Types.ObjectId(dto.branchId),
        tenantId: tId,
      }).exec();
      if (!branch) {
        throw new NotFoundException(`Branch ${dto.branchId} not found in tenant`);
      }
      branchObjectId = branch._id as Types.ObjectId;
    }

    let supplierObjectId: Types.ObjectId | undefined;
    if (dto.supplierId) {
      if (!Types.ObjectId.isValid(dto.supplierId.toString())) {
        throw new NotFoundException(`Supplier ${dto.supplierId} not found`);
      }
      const supplier = await this.supplierModel.findOne({
        _id: new Types.ObjectId(dto.supplierId),
        tenantId: tId,
        isDeleted: false,
      }).exec();
      if (!supplier) {
        throw new NotFoundException(`Supplier ${dto.supplierId} not found in tenant`);
      }
      supplierObjectId = supplier._id as Types.ObjectId;
    }

    const expenseNumber = await this.counterService.generateExpenseNumber(tId);
    const expenseDate = dto.expenseDate || new Date().toISOString().split('T')[0];

    const expense = new this.expenseModel({
      tenantId: tId,
      branchId: branchObjectId,
      expenseNumber,
      categoryId: category._id,
      title: dto.title.trim(),
      description: dto.description?.trim(),
      amount: Math.round(dto.amount),
      expenseDate,
      paymentMethod: dto.paymentMethod || ExpensePaymentMethod.CASH,
      supplierId: supplierObjectId,
      status: ExpenseStatus.PENDING_APPROVAL,
      attachmentUrl: dto.attachmentUrl,
      referenceNumber: dto.referenceNumber?.trim(),
      notes: dto.notes?.trim(),
      createdBy: actorUserId ? new Types.ObjectId(actorUserId) : undefined,
    });

    const saved = await expense.save();

    if (actorUserId) {
      await this.auditService.log({
        tenantId: tId,
        actorUserId,
        branchId: branchObjectId,
        action: 'EXPENSE_CREATED',
        entity: 'Expense',
        entityId: saved._id.toString(),
        metadata: {
          expenseNumber,
          amount: saved.amount,
          title: saved.title,
          category: category.name,
        },
      });
    }

    return saved;
  }

  async findAll(
    tenantId: string | Types.ObjectId,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      branchId?: string;
      categoryId?: string;
      supplierId?: string;
      status?: string;
      paymentMethod?: string;
      dateFrom?: string;
      dateTo?: string;
    },
    userBranchIds?: string[],
  ): Promise<{ items: any[]; total: number; page: number; limit: number }> {
    const tId = new Types.ObjectId(tenantId.toString());
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: any = { tenantId: tId };

    if (userBranchIds && userBranchIds.length > 0) {
      const branchObjs = userBranchIds.map((id) => new Types.ObjectId(id));
      filter.$or = [{ branchId: { $in: branchObjs } }, { branchId: { $exists: false } }, { branchId: null }];
    }

    if (query.branchId) {
      filter.branchId = new Types.ObjectId(query.branchId);
    }

    if (query.categoryId) {
      filter.categoryId = new Types.ObjectId(query.categoryId);
    }

    if (query.supplierId) {
      filter.supplierId = new Types.ObjectId(query.supplierId);
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.paymentMethod) {
      filter.paymentMethod = query.paymentMethod;
    }

    if (query.dateFrom || query.dateTo) {
      filter.expenseDate = {};
      if (query.dateFrom) filter.expenseDate.$gte = query.dateFrom;
      if (query.dateTo) filter.expenseDate.$lte = query.dateTo;
    }

    if (query.search) {
      const s = query.search.trim();
      filter.$or = [
        { title: { $regex: s, $options: 'i' } },
        { expenseNumber: { $regex: s, $options: 'i' } },
        { referenceNumber: { $regex: s, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.expenseModel
        .find(filter)
        .populate('categoryId', 'name code icon color')
        .populate('branchId', 'name code')
        .populate('supplierId', 'businessName contactPerson phone')
        .populate('createdBy', 'name email')
        .populate('approvedBy', 'name email')
        .sort({ expenseDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.expenseModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async findById(tenantId: string | Types.ObjectId, id: string): Promise<any> {
    if (!id || !Types.ObjectId.isValid(id.toString())) {
      throw new NotFoundException(`Expense ${id} not found`);
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const expense = await this.expenseModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: tId })
      .populate('categoryId', 'name code icon color')
      .populate('branchId', 'name code')
      .populate('supplierId', 'businessName contactPerson phone')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .lean()
      .exec();

    if (!expense) {
      throw new NotFoundException(`Expense ${id} not found`);
    }

    return expense;
  }

  async update(
    tenantId: string | Types.ObjectId,
    id: string,
    dto: UpdateExpenseDto,
    actorUserId?: string,
  ): Promise<ExpenseDocument> {
    if (!id || !Types.ObjectId.isValid(id.toString())) {
      throw new NotFoundException(`Expense ${id} not found`);
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const expense = await this.expenseModel.findOne({ _id: new Types.ObjectId(id), tenantId: tId }).exec();
    if (!expense) {
      throw new NotFoundException(`Expense ${id} not found`);
    }

    if (expense.status === ExpenseStatus.PAID) {
      throw new BadRequestException('Paid expenses cannot be modified. Cancel and recreate if needed.');
    }

    if (dto.title !== undefined) expense.title = dto.title.trim();
    if (dto.description !== undefined) expense.description = dto.description.trim();
    if (dto.amount !== undefined) {
      if (dto.amount <= 0) throw new BadRequestException('Amount must be greater than zero');
      expense.amount = Math.round(dto.amount);
    }
    if (dto.expenseDate !== undefined) expense.expenseDate = dto.expenseDate;
    if (dto.paymentMethod !== undefined) expense.paymentMethod = dto.paymentMethod;
    if (dto.attachmentUrl !== undefined) expense.attachmentUrl = dto.attachmentUrl;
    if (dto.referenceNumber !== undefined) expense.referenceNumber = dto.referenceNumber.trim();
    if (dto.notes !== undefined) expense.notes = dto.notes.trim();

    if (dto.categoryId) {
      if (!Types.ObjectId.isValid(dto.categoryId.toString())) {
        throw new NotFoundException(`Category ${dto.categoryId} not found`);
      }
      const cat = await this.categoryModel.findOne({ _id: new Types.ObjectId(dto.categoryId), tenantId: tId }).exec();
      if (!cat) throw new NotFoundException(`Category ${dto.categoryId} not found in tenant`);
      expense.categoryId = cat._id as Types.ObjectId;
    }

    if (dto.branchId !== undefined) {
      if (dto.branchId) {
        if (!Types.ObjectId.isValid(dto.branchId.toString())) {
          throw new NotFoundException(`Branch ${dto.branchId} not found`);
        }
        const b = await this.branchModel.findOne({ _id: new Types.ObjectId(dto.branchId), tenantId: tId }).exec();
        if (!b) throw new NotFoundException(`Branch ${dto.branchId} not found in tenant`);
        expense.branchId = b._id as Types.ObjectId;
      } else {
        expense.branchId = undefined;
      }
    }

    const saved = await expense.save();

    if (actorUserId) {
      await this.auditService.log({
        tenantId: tId,
        actorUserId,
        branchId: expense.branchId,
        action: 'EXPENSE_UPDATED',
        entity: 'Expense',
        entityId: saved._id.toString(),
        metadata: { amount: saved.amount, status: saved.status },
      });
    }

    return saved;
  }

  async approve(
    tenantId: string | Types.ObjectId,
    id: string,
    actorUserId?: string,
  ): Promise<ExpenseDocument> {
    if (!id || !Types.ObjectId.isValid(id.toString())) {
      throw new NotFoundException(`Expense ${id} not found`);
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const expense = await this.expenseModel.findOne({ _id: new Types.ObjectId(id), tenantId: tId }).exec();
    if (!expense) {
      throw new NotFoundException(`Expense ${id} not found`);
    }

    if (expense.status === ExpenseStatus.PAID) {
      throw new BadRequestException('Expense is already paid');
    }
    if (expense.status === ExpenseStatus.CANCELLED) {
      throw new BadRequestException('Cancelled expense cannot be approved');
    }

    expense.status = ExpenseStatus.APPROVED;
    expense.approvedBy = actorUserId ? new Types.ObjectId(actorUserId) : undefined;
    expense.approvedAt = new Date();

    const saved = await expense.save();

    if (actorUserId) {
      await this.auditService.log({
        tenantId: tId,
        actorUserId,
        branchId: expense.branchId,
        action: 'EXPENSE_APPROVED',
        entity: 'Expense',
        entityId: saved._id.toString(),
        metadata: { expenseNumber: expense.expenseNumber, amount: expense.amount },
      });
    }

    return saved;
  }

  async reject(
    tenantId: string | Types.ObjectId,
    id: string,
    dto: RejectExpenseDto,
    actorUserId?: string,
  ): Promise<ExpenseDocument> {
    if (!id || !Types.ObjectId.isValid(id.toString())) {
      throw new NotFoundException(`Expense ${id} not found`);
    }
    if (!dto.rejectionReason || !dto.rejectionReason.trim()) {
      throw new BadRequestException('Rejection reason is mandatory');
    }

    const tId = new Types.ObjectId(tenantId.toString());
    const expense = await this.expenseModel.findOne({ _id: new Types.ObjectId(id), tenantId: tId }).exec();
    if (!expense) {
      throw new NotFoundException(`Expense ${id} not found`);
    }

    if (expense.status === ExpenseStatus.PAID) {
      throw new BadRequestException('Paid expense cannot be rejected');
    }

    expense.status = ExpenseStatus.REJECTED;
    expense.rejectionReason = dto.rejectionReason.trim();

    const saved = await expense.save();

    if (actorUserId) {
      await this.auditService.log({
        tenantId: tId,
        actorUserId,
        branchId: expense.branchId,
        action: 'EXPENSE_REJECTED',
        entity: 'Expense',
        entityId: saved._id.toString(),
        metadata: { reason: dto.rejectionReason },
      });
    }

    return saved;
  }

  async pay(
    tenantId: string | Types.ObjectId,
    id: string,
    dto: PayExpenseDto,
    actorUserId?: string,
  ): Promise<ExpenseDocument> {
    if (!id || !Types.ObjectId.isValid(id.toString())) {
      throw new NotFoundException(`Expense ${id} not found`);
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const expense = await this.expenseModel.findOne({ _id: new Types.ObjectId(id), tenantId: tId }).exec();
    if (!expense) {
      throw new NotFoundException(`Expense ${id} not found`);
    }

    if (expense.status === ExpenseStatus.PAID) {
      throw new BadRequestException('Expense is already marked as paid');
    }
    if (expense.status === ExpenseStatus.CANCELLED || expense.status === ExpenseStatus.REJECTED) {
      throw new BadRequestException(`Cannot pay a ${expense.status.toLowerCase()} expense`);
    }

    expense.status = ExpenseStatus.PAID;
    expense.paidAt = new Date();
    if (dto.paymentMethod) expense.paymentMethod = dto.paymentMethod;
    if (dto.referenceNumber) expense.referenceNumber = dto.referenceNumber.trim();
    if (dto.notes) expense.notes = `${expense.notes ? expense.notes + ' | ' : ''}${dto.notes.trim()}`;

    const saved = await expense.save();

    if (actorUserId) {
      await this.auditService.log({
        tenantId: tId,
        actorUserId,
        branchId: expense.branchId,
        action: 'EXPENSE_PAID',
        entity: 'Expense',
        entityId: saved._id.toString(),
        metadata: {
          expenseNumber: expense.expenseNumber,
          amount: expense.amount,
          paymentMethod: expense.paymentMethod,
          referenceNumber: expense.referenceNumber,
        },
      });
    }

    return saved;
  }

  async delete(
    tenantId: string | Types.ObjectId,
    id: string,
    actorUserId?: string,
  ): Promise<ExpenseDocument> {
    if (!id || !Types.ObjectId.isValid(id.toString())) {
      throw new NotFoundException(`Expense ${id} not found`);
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const expense = await this.expenseModel.findOne({ _id: new Types.ObjectId(id), tenantId: tId }).exec();
    if (!expense) {
      throw new NotFoundException(`Expense ${id} not found`);
    }

    expense.status = ExpenseStatus.CANCELLED;
    const saved = await expense.save();

    if (actorUserId) {
      await this.auditService.log({
        tenantId: tId,
        actorUserId,
        branchId: expense.branchId,
        action: 'EXPENSE_CANCELLED',
        entity: 'Expense',
        entityId: saved._id.toString(),
      });
    }

    return saved;
  }
}
