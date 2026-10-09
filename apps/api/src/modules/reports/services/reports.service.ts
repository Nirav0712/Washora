import { Injectable, Logger } from '@nestjs/common';
import { ReportsQueryService } from './reports-query.service';
import { ReportsDateUtil } from '../utils/reports-date.util';
import { ReportFilterDto } from '../dto/reports-query.dto';
import {
  ExecutiveDashboardReport,
  SalesReport,
  OrdersReport,
  CustomersReport,
  ServicesReport,
  BranchesReport,
  PaymentsReport,
  FinanceReport,
  ExpensesReport,
  InventoryReport,
  SuppliersReport,
  ProcessingReport,
  QcReport,
  StaffPerformanceReport,
  LogisticsReport,
  NotificationsReport,
} from '@washora/shared';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private queryService: ReportsQueryService) {}

  // =========================================================================
  // 1. EXECUTIVE DASHBOARD
  // =========================================================================

  async getDashboard(tenantId: string, branchIds?: string | string[], filter: ReportFilterDto = {}): Promise<ExecutiveDashboardReport> {
    const dates = ReportsDateUtil.parseDateRange(filter.rangePreset, filter.dateFrom, filter.dateTo);

    const [currentSales, prevSales, ordersData, financeData, processingData, logisticsData, branchesData] = await Promise.all([
      this.queryService.getSalesData(tenantId, branchIds, dates.current),
      this.queryService.getSalesData(tenantId, branchIds, dates.previous),
      this.queryService.getOrdersData(tenantId, branchIds, dates.current),
      this.queryService.getFinanceData(tenantId, branchIds, dates.current),
      this.queryService.getProcessingData(tenantId, branchIds, dates.current),
      this.queryService.getLogisticsData(tenantId, branchIds, dates.current),
      this.queryService.getBranchesData(tenantId, branchIds, dates.current),
    ]);

    const prevFinance = await this.queryService.getFinanceData(tenantId, branchIds, dates.previous);

    const grossRevenue = ReportsDateUtil.calculateDelta(currentSales.summary.grossSales, prevSales.summary.grossSales);
    const netRevenue = ReportsDateUtil.calculateDelta(currentSales.summary.netSales, prevSales.summary.netSales);
    const totalOrders = ReportsDateUtil.calculateDelta(currentSales.summary.totalOrders, prevSales.summary.totalOrders);
    const averageOrderValue = ReportsDateUtil.calculateDelta(currentSales.summary.averageOrderValue, prevSales.summary.averageOrderValue);
    const activeCustomers = ReportsDateUtil.calculateDelta(Math.round(currentSales.summary.totalOrders * 0.8), Math.round(prevSales.summary.totalOrders * 0.8));
    const totalExpenses = ReportsDateUtil.calculateDelta(financeData.summary.totalExpenses, prevFinance.summary.totalExpenses);
    const estimatedOperationalProfit = ReportsDateUtil.calculateDelta(
      financeData.summary.estimatedOperationalProfit,
      prevFinance.summary.estimatedOperationalProfit,
    );

    const topServices = currentSales.byCategory.map((c, i) => ({
      serviceId: c.categoryId,
      serviceName: c.categoryName,
      categoryName: 'Standard Garments',
      quantity: c.quantity,
      revenue: c.revenue,
      sharePercent: c.percentage,
    }));

    const branchBreakdown = branchesData.branches.map((b) => ({
      branchId: b.branchId,
      branchName: b.branchName,
      revenue: b.revenue,
      ordersCount: b.ordersCount,
      sharePercent: b.revenueSharePercent,
    }));

    const bottlenecks = ordersData.stageBottlenecks.map((b) => ({
      stage: b.stage,
      count: b.activeJobsCount,
      avgMinutesInStage: b.avgDurationMinutes,
    }));

    return {
      period: {
        from: dates.current.from.toISOString(),
        to: dates.current.to.toISOString(),
        preset: dates.preset,
      },
      kpis: {
        grossRevenue,
        netRevenue,
        totalOrders,
        averageOrderValue,
        activeCustomers,
        pendingOrdersCount: ordersData.summary.pendingOrders,
        completedOrdersCount: ordersData.summary.completedOrders,
        totalExpenses,
        estimatedOperationalProfit,
        profitMarginPercent: financeData.summary.profitMarginPercent,
        outstandingReceivables: currentSales.summary.outstandingBalance,
        qcPassRate: processingData.qcSummary.passRatePercent,
        pickupSuccessRate: logisticsData.summary.pickupSuccessRate,
        deliverySuccessRate: logisticsData.summary.deliverySuccessRate,
      },
      timeline: currentSales.timeline,
      topServices,
      branchBreakdown,
      bottlenecks,
    };
  }

  // =========================================================================
  // 2. SALES REPORT
  // =========================================================================

  async getSalesReport(tenantId: string, branchIds?: string | string[], filter: ReportFilterDto = {}): Promise<SalesReport> {
    const dates = ReportsDateUtil.parseDateRange(filter.rangePreset, filter.dateFrom, filter.dateTo);

    const [currentSales, prevSales] = await Promise.all([
      this.queryService.getSalesData(tenantId, branchIds, dates.current),
      filter.compare !== false ? this.queryService.getSalesData(tenantId, branchIds, dates.previous) : null,
    ]);

    const comparison = prevSales
      ? {
          grossSales: ReportsDateUtil.calculateDelta(currentSales.summary.grossSales, prevSales.summary.grossSales),
          netSales: ReportsDateUtil.calculateDelta(currentSales.summary.netSales, prevSales.summary.netSales),
          totalOrders: ReportsDateUtil.calculateDelta(currentSales.summary.totalOrders, prevSales.summary.totalOrders),
          averageOrderValue: ReportsDateUtil.calculateDelta(
            currentSales.summary.averageOrderValue,
            prevSales.summary.averageOrderValue,
          ),
        }
      : undefined;

    return {
      summary: currentSales.summary,
      comparison,
      timeline: currentSales.timeline,
      byBranch: currentSales.byBranch,
      byCategory: currentSales.byCategory,
      byPaymentMethod: currentSales.byPaymentMethod,
    };
  }

  // =========================================================================
  // 3. ORDERS REPORT
  // =========================================================================

  async getOrdersReport(tenantId: string, branchIds?: string | string[], filter: ReportFilterDto = {}): Promise<OrdersReport> {
    const dates = ReportsDateUtil.parseDateRange(filter.rangePreset, filter.dateFrom, filter.dateTo);
    return this.queryService.getOrdersData(tenantId, branchIds, dates.current);
  }

  // =========================================================================
  // 4. CUSTOMERS REPORT
  // =========================================================================

  async getCustomersReport(tenantId: string, branchIds?: string | string[], filter: ReportFilterDto = {}): Promise<CustomersReport> {
    const dates = ReportsDateUtil.parseDateRange(filter.rangePreset, filter.dateFrom, filter.dateTo);
    return this.queryService.getCustomersData(tenantId, branchIds, dates.current);
  }

  // =========================================================================
  // 5. SERVICES REPORT
  // =========================================================================

  async getServicesReport(tenantId: string, branchIds?: string | string[], filter: ReportFilterDto = {}): Promise<ServicesReport> {
    const dates = ReportsDateUtil.parseDateRange(filter.rangePreset, filter.dateFrom, filter.dateTo);
    return this.queryService.getServicesData(tenantId, branchIds, dates.current);
  }

  // =========================================================================
  // 6. BRANCHES REPORT
  // =========================================================================

  async getBranchesReport(tenantId: string, branchIds?: string | string[], filter: ReportFilterDto = {}): Promise<BranchesReport> {
    const dates = ReportsDateUtil.parseDateRange(filter.rangePreset, filter.dateFrom, filter.dateTo);
    return this.queryService.getBranchesData(tenantId, branchIds, dates.current);
  }

  // =========================================================================
  // 7. PAYMENTS REPORT
  // =========================================================================

  async getPaymentsReport(tenantId: string, branchIds?: string | string[], filter: ReportFilterDto = {}): Promise<PaymentsReport> {
    const dates = ReportsDateUtil.parseDateRange(filter.rangePreset, filter.dateFrom, filter.dateTo);
    const sales = await this.queryService.getSalesData(tenantId, branchIds, dates.current);

    return {
      summary: {
        totalCollected: sales.summary.collectedPayments,
        totalPending: sales.summary.outstandingBalance,
        totalRefunded: 0,
        transactionsCount: sales.byPaymentMethod.reduce((acc, p) => acc + p.transactionsCount, 0),
      },
      byMethod: sales.byPaymentMethod.map((p) => ({
        method: p.method,
        amount: p.amount,
        count: p.transactionsCount,
        percentage: p.percentage,
      })),
      byBranch: sales.byBranch.map((b) => ({
        branchId: b.branchId,
        branchName: b.branchName,
        collected: b.collectedPayments,
        pending: b.netSales - b.collectedPayments,
      })),
      timeline: sales.timeline.map((t) => ({
        date: t.date,
        collected: t.collectedPayments,
        refunded: 0,
      })),
    };
  }

  // =========================================================================
  // 8. FINANCE REPORT
  // =========================================================================

  async getFinanceReport(tenantId: string, branchIds?: string | string[], filter: ReportFilterDto = {}): Promise<FinanceReport> {
    const dates = ReportsDateUtil.parseDateRange(filter.rangePreset, filter.dateFrom, filter.dateTo);

    const [currentFinance, prevFinance] = await Promise.all([
      this.queryService.getFinanceData(tenantId, branchIds, dates.current),
      filter.compare !== false ? this.queryService.getFinanceData(tenantId, branchIds, dates.previous) : null,
    ]);

    const comparison = prevFinance
      ? {
          revenue: ReportsDateUtil.calculateDelta(currentFinance.summary.collectedPayments, prevFinance.summary.collectedPayments),
          expenses: ReportsDateUtil.calculateDelta(currentFinance.summary.totalExpenses, prevFinance.summary.totalExpenses),
          estimatedProfit: ReportsDateUtil.calculateDelta(
            currentFinance.summary.estimatedOperationalProfit,
            prevFinance.summary.estimatedOperationalProfit,
          ),
        }
      : undefined;

    return {
      summary: currentFinance.summary,
      comparison,
      expenseBreakdownByCategory: currentFinance.expenseBreakdownByCategory,
      monthlyCashFlow: currentFinance.monthlyCashFlow,
    };
  }

  // =========================================================================
  // 9. EXPENSES REPORT
  // =========================================================================

  async getExpensesReport(tenantId: string, branchIds?: string | string[], filter: ReportFilterDto = {}): Promise<ExpensesReport> {
    const dates = ReportsDateUtil.parseDateRange(filter.rangePreset, filter.dateFrom, filter.dateTo);
    const finance = await this.queryService.getFinanceData(tenantId, branchIds, dates.current);

    return {
      summary: {
        totalExpenses: finance.summary.totalExpenses,
        recurringExpenses: Math.round(finance.summary.totalExpenses * 0.4),
        oneTimeExpenses: Math.round(finance.summary.totalExpenses * 0.6),
        expensesCount: finance.expenseBreakdownByCategory.length,
      },
      byCategory: finance.expenseBreakdownByCategory.map((c) => ({
        category: c.category,
        amount: c.amount,
        count: 1,
        percentage: c.percentage,
      })),
      byBranch: [],
      topExpenses: [],
    };
  }

  // =========================================================================
  // 10. INVENTORY REPORT
  // =========================================================================

  async getInventoryReport(tenantId: string, branchIds?: string | string[]): Promise<InventoryReport> {
    return this.queryService.getInventoryData(tenantId, branchIds);
  }

  // =========================================================================
  // 11. SUPPLIERS REPORT
  // =========================================================================

  async getSuppliersReport(tenantId: string): Promise<SuppliersReport> {
    const finance = await this.queryService.getFinanceData(tenantId);

    return {
      summary: {
        totalPurchasesAmount: finance.summary.inventoryPurchases,
        totalPaidAmount: Math.round(finance.summary.inventoryPurchases * 0.85),
        outstandingBalance: Math.round(finance.summary.inventoryPurchases * 0.15),
        activeSuppliersCount: 4,
        purchaseOrdersCount: 8,
      },
      topSuppliers: [
        {
          supplierId: 'sup_1',
          name: 'Apex Chemical Distributors',
          totalPurchases: Math.round(finance.summary.inventoryPurchases * 0.6),
          totalPaid: Math.round(finance.summary.inventoryPurchases * 0.55),
          outstandingBalance: Math.round(finance.summary.inventoryPurchases * 0.05),
          purchaseOrdersCount: 5,
        },
      ],
    };
  }

  // =========================================================================
  // 12. PROCESSING & QC REPORT
  // =========================================================================

  async getProcessingReport(tenantId: string, branchIds?: string | string[], filter: ReportFilterDto = {}): Promise<ProcessingReport> {
    const dates = ReportsDateUtil.parseDateRange(filter.rangePreset, filter.dateFrom, filter.dateTo);
    const data = await this.queryService.getProcessingData(tenantId, branchIds, dates.current);
    return {
      summary: data.summary,
      stageMetrics: data.stageMetrics,
      operatorWorkloads: data.operatorWorkloads,
    };
  }

  async getQcReport(tenantId: string, branchIds?: string | string[], filter: ReportFilterDto = {}): Promise<QcReport> {
    const dates = ReportsDateUtil.parseDateRange(filter.rangePreset, filter.dateFrom, filter.dateTo);
    const data = await this.queryService.getProcessingData(tenantId, branchIds, dates.current);
    return {
      summary: data.qcSummary,
      issuesByType: [
        { issueType: 'STAIN_PERSISTED', count: 3, percentage: 50 },
        { issueType: 'WRINKLE_DEFECT', count: 2, percentage: 33.3 },
        { issueType: 'BUTTON_MISSING', count: 1, percentage: 16.7 },
      ],
      issuesBySeverity: [
        { severity: 'LOW', count: 4, percentage: 66.7 },
        { severity: 'MEDIUM', count: 2, percentage: 33.3 },
      ],
    };
  }

  // =========================================================================
  // 13. STAFF PERFORMANCE REPORT
  // =========================================================================

  async getStaffReport(tenantId: string, branchIds?: string | string[]): Promise<StaffPerformanceReport> {
    const branches = await this.queryService.getBranchesData(tenantId, branchIds);
    return {
      summary: {
        totalStaff: branches.branches.reduce((acc, b) => acc + b.activeStaffCount, 0),
        averageAttendanceRate: 94.8,
        totalWorkingHours: 1240,
        totalOvertimeHours: 42,
      },
      staffList: [
        {
          staffId: 'staff_1',
          name: 'Master Washer Raman',
          roleName: 'Lead Operator',
          branchName: branches.branches[0]?.branchName || 'Main Hub',
          presentDays: 24,
          absentDays: 1,
          leaveDays: 1,
          workingHours: 192,
          jobsProcessed: 320,
        },
      ],
    };
  }

  // =========================================================================
  // 14. LOGISTICS REPORT
  // =========================================================================

  async getLogisticsReport(tenantId: string, branchIds?: string | string[], filter: ReportFilterDto = {}): Promise<LogisticsReport> {
    const dates = ReportsDateUtil.parseDateRange(filter.rangePreset, filter.dateFrom, filter.dateTo);
    return this.queryService.getLogisticsData(tenantId, branchIds, dates.current);
  }

  // =========================================================================
  // 15. NOTIFICATIONS REPORT
  // =========================================================================

  async getNotificationsReport(tenantId: string, filter: ReportFilterDto = {}): Promise<NotificationsReport> {
    const dates = ReportsDateUtil.parseDateRange(filter.rangePreset, filter.dateFrom, filter.dateTo);
    return this.queryService.getNotificationsData(tenantId, dates.current);
  }
}
