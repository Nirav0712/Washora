import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument } from '../../schemas/payment.schema';
import { Expense, ExpenseDocument } from '../../schemas/expense.schema';
import { Order, OrderDocument } from '../../schemas/order.schema';
import { Supplier, SupplierDocument } from '../../schemas/supplier.schema';
import { Purchase, PurchaseDocument } from '../../schemas/purchase.schema';
import { InventoryItem, InventoryItemDocument } from '../../schemas/inventory-item.schema';
import { ExpenseStatus, PaymentStatus } from '@washora/shared';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,
    @InjectModel(Expense.name)
    private expenseModel: Model<ExpenseDocument>,
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    @InjectModel(Supplier.name)
    private supplierModel: Model<SupplierDocument>,
    @InjectModel(Purchase.name)
    private purchaseModel: Model<PurchaseDocument>,
    @InjectModel(InventoryItem.name)
    private inventoryItemModel: Model<InventoryItemDocument>,
  ) {}

  // ==========================================
  // FINANCE DASHBOARD
  // ==========================================

  async getDashboard(tenantId: string, branchId?: string): Promise<any> {
    const tenantObjectId = new Types.ObjectId(tenantId);
    const branchObjectId = branchId && Types.ObjectId.isValid(branchId) ? new Types.ObjectId(branchId) : null;

    // Base filters
    const paymentFilter: Record<string, any> = {
      tenantId: tenantObjectId,
      status: 'COMPLETED',
    };
    const expenseFilter: Record<string, any> = {
      tenantId: tenantObjectId,
      status: { $in: [ExpenseStatus.APPROVED, ExpenseStatus.PAID] },
      isDeleted: { $ne: true },
    };
    const orderFilter: Record<string, any> = {
      tenantId: tenantObjectId,
    };
    const supplierFilter: Record<string, any> = {
      tenantId: tenantObjectId,
      isDeleted: { $ne: true },
    };
    const inventoryFilter: Record<string, any> = {
      tenantId: tenantObjectId,
      isDeleted: { $ne: true },
      isActive: true,
    };

    if (branchObjectId) {
      paymentFilter.branchId = branchObjectId;
      expenseFilter.branchId = branchObjectId;
      orderFilter.branchId = branchObjectId;
      inventoryFilter.branchId = branchObjectId;
    }

    const [
      paymentAgg,
      expenseAgg,
      orderAgg,
      supplierAgg,
      inventoryItems,
      recentPayments,
      recentExpenses,
    ] = await Promise.all([
      // Total Revenue from customer payments
      this.paymentModel.aggregate([
        { $match: paymentFilter },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      // Total Approved/Paid Expenses
      this.expenseModel.aggregate([
        { $match: expenseFilter },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      // Customer Receivables (Unpaid Order Balances)
      this.orderModel.aggregate([
        { $match: orderFilter },
        { $group: { _id: null, totalDue: { $sum: '$balanceAmount' }, count: { $sum: 1 } } },
      ]),
      // Supplier Payables
      this.supplierModel.aggregate([
        { $match: supplierFilter },
        { $group: { _id: null, totalPayable: { $sum: '$currentBalance' }, count: { $sum: 1 } } },
      ]),
      // Inventory Valuation
      this.inventoryItemModel.find(inventoryFilter).exec(),
      // Recent Payments
      this.paymentModel
        .find(paymentFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('customerId', 'fullName phone')
        .populate('branchId', 'name')
        .exec(),
      // Recent Expenses
      this.expenseModel
        .find(expenseFilter)
        .sort({ expenseDate: -1, createdAt: -1 })
        .limit(5)
        .populate('categoryId', 'name')
        .populate('branchId', 'name')
        .exec(),
    ]);

    const totalRevenue = paymentAgg[0]?.total || 0;
    const totalExpenses = expenseAgg[0]?.total || 0;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 10000) / 100 : 0;
    const totalReceivables = orderAgg[0]?.totalDue || 0;
    const totalPayables = supplierAgg[0]?.totalPayable || 0;

    let inventoryValuation = 0;
    for (const item of inventoryItems) {
      inventoryValuation += Math.round((item.currentStock || 0) * (item.averageCost || 0));
    }

    return {
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin, // in %
        totalReceivables,
        totalPayables,
        inventoryValuation,
      },
      recentPayments,
      recentExpenses,
    };
  }

  // ==========================================
  // REVENUE REPORT
  // ==========================================

  async getRevenueReport(
    tenantId: string,
    query: { branchId?: string; startDate?: string; endDate?: string } = {},
  ): Promise<any> {
    const match: Record<string, any> = {
      tenantId: new Types.ObjectId(tenantId),
      status: 'COMPLETED',
    };

    if (query.branchId && Types.ObjectId.isValid(query.branchId)) {
      match.branchId = new Types.ObjectId(query.branchId);
    }

    if (query.startDate || query.endDate) {
      match.createdAt = {};
      if (query.startDate) match.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        match.createdAt.$lte = end;
      }
    }

    const [byPaymentMethod, byDate, totalAgg] = await Promise.all([
      this.paymentModel.aggregate([
        { $match: match },
        { $group: { _id: '$method', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      this.paymentModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.paymentModel.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);

    return {
      totalRevenue: totalAgg[0]?.total || 0,
      totalTransactions: totalAgg[0]?.count || 0,
      byPaymentMethod,
      byDate,
    };
  }

  // ==========================================
  // EXPENSE REPORT
  // ==========================================

  async getExpenseReport(
    tenantId: string,
    query: { branchId?: string; startDate?: string; endDate?: string } = {},
  ): Promise<any> {
    const match: Record<string, any> = {
      tenantId: new Types.ObjectId(tenantId),
      isDeleted: { $ne: true },
      status: { $in: [ExpenseStatus.APPROVED, ExpenseStatus.PAID] },
    };

    if (query.branchId && Types.ObjectId.isValid(query.branchId)) {
      match.branchId = new Types.ObjectId(query.branchId);
    }

    if (query.startDate || query.endDate) {
      match.expenseDate = {};
      if (query.startDate) match.expenseDate.$gte = query.startDate;
      if (query.endDate) match.expenseDate.$lte = query.endDate;
    }

    const [byCategory, byDate, byPaymentMethod, totalAgg] = await Promise.all([
      this.expenseModel.aggregate([
        { $match: match },
        {
          $lookup: {
            from: 'expense_categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$categoryId',
            categoryName: { $first: '$category.name' },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),
      this.expenseModel.aggregate([
        { $match: match },
        { $group: { _id: '$expenseDate', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      this.expenseModel.aggregate([
        { $match: match },
        { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      this.expenseModel.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);

    return {
      totalExpenses: totalAgg[0]?.total || 0,
      totalCount: totalAgg[0]?.count || 0,
      byCategory: byCategory.map((c) => ({
        categoryId: c._id,
        categoryName: c.categoryName || 'Uncategorized',
        total: c.total,
        count: c.count,
      })),
      byDate,
      byPaymentMethod,
    };
  }

  // ==========================================
  // PROFIT & LOSS REPORT
  // ==========================================

  async getProfitLossReport(
    tenantId: string,
    query: { branchId?: string; startDate?: string; endDate?: string } = {},
  ): Promise<any> {
    const [revenueReport, expenseReport] = await Promise.all([
      this.getRevenueReport(tenantId, query),
      this.getExpenseReport(tenantId, query),
    ]);

    const totalRevenue = revenueReport.totalRevenue;
    const totalExpenses = expenseReport.totalExpenses;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 10000) / 100 : 0;

    // Merge date intervals
    const dateMap = new Map<string, { date: string; revenue: number; expense: number; profit: number }>();

    for (const r of revenueReport.byDate) {
      dateMap.set(r._id, {
        date: r._id,
        revenue: r.total,
        expense: 0,
        profit: r.total,
      });
    }

    for (const e of expenseReport.byDate) {
      const existing = dateMap.get(e._id) || {
        date: e._id,
        revenue: 0,
        expense: 0,
        profit: 0,
      };
      existing.expense = e.total;
      existing.profit = existing.revenue - e.total;
      dateMap.set(e._id, existing);
    }

    const timeline = Array.from(dateMap.values()).sort((a, b) => (a.date > b.date ? 1 : -1));

    return {
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
      },
      revenueByCategory: revenueReport.byPaymentMethod,
      expenseByCategory: expenseReport.byCategory,
      timeline,
    };
  }
}
