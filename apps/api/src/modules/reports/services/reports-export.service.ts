import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ExportReportDto } from '../dto/reports-query.dto';

@Injectable()
export class ReportsExportService {
  private readonly logger = new Logger(ReportsExportService.name);

  constructor(private reportsService: ReportsService) {}

  private escapeCsvCell(value: any): string {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }

  private buildCsvString(headers: string[], rows: (string | number)[][]): string {
    const headerLine = headers.map(this.escapeCsvCell).join(',');
    const dataLines = rows.map((row) => row.map(this.escapeCsvCell).join(','));
    return [headerLine, ...dataLines].join('\r\n');
  }

  async exportReportToCsv(
    reportType: string,
    tenantId: string,
    branchIds?: string | string[],
    filter: ExportReportDto = {},
  ): Promise<{ filename: string; contentType: string; data: string }> {
    const timestamp = new Date().toISOString().split('T')[0];

    switch (reportType.toLowerCase()) {
      case 'sales': {
        const report = await this.reportsService.getSalesReport(tenantId, branchIds, filter);
        const headers = ['Date', 'Gross Revenue (INR)', 'Orders Count', 'Collected Payments (INR)'];
        const rows = report.timeline.map((t) => [t.date, t.revenue, t.ordersCount, t.collectedPayments]);

        return {
          filename: `sales_report_${timestamp}.csv`,
          contentType: 'text/csv; charset=utf-8',
          data: this.buildCsvString(headers, rows),
        };
      }

      case 'orders': {
        const report = await this.reportsService.getOrdersReport(tenantId, branchIds, filter);
        const headers = ['Order Status', 'Count', 'Percentage (%)'];
        const rows = report.statusDistribution.map((s) => [s.status, s.count, `${s.percentage}%`]);

        return {
          filename: `orders_report_${timestamp}.csv`,
          contentType: 'text/csv; charset=utf-8',
          data: this.buildCsvString(headers, rows),
        };
      }

      case 'customers': {
        const report = await this.reportsService.getCustomersReport(tenantId, branchIds, filter);
        const headers = ['Customer Name', 'Phone', 'Total Orders', 'Total Spend (INR)', 'Outstanding Balance (INR)', 'Last Order Date', 'Segment'];
        const rows = report.topCustomers.map((c) => [
          c.name,
          c.phone,
          c.totalOrders,
          c.totalSpend,
          c.outstandingBalance,
          c.lastOrderDate,
          c.segment,
        ]);

        return {
          filename: `customers_report_${timestamp}.csv`,
          contentType: 'text/csv; charset=utf-8',
          data: this.buildCsvString(headers, rows),
        };
      }

      case 'inventory': {
        const report = await this.reportsService.getInventoryReport(tenantId, branchIds);
        const headers = ['Item Name', 'SKU', 'Current Stock', 'Min Threshold', 'Unit', 'Unit Price (INR)', 'Deficit Quantity'];
        const rows = report.lowStockAlerts.map((i) => [
          i.name,
          i.sku,
          i.currentStock,
          i.minThreshold,
          i.unit,
          i.unitPrice,
          i.deficit,
        ]);

        return {
          filename: `inventory_report_${timestamp}.csv`,
          contentType: 'text/csv; charset=utf-8',
          data: this.buildCsvString(headers, rows),
        };
      }

      case 'finance': {
        const report = await this.reportsService.getFinanceReport(tenantId, branchIds, filter);
        const headers = ['Metric', 'Amount (INR)'];
        const rows = [
          ['Gross Order Revenue', report.summary.grossRevenue],
          ['Net Order Revenue', report.summary.netRevenue],
          ['Collected Customer Payments', report.summary.collectedPayments],
          ['Operating Expenses', report.summary.totalExpenses],
          ['Inventory Purchases', report.summary.inventoryPurchases],
          ['Approved Payroll', report.summary.payrollExpenses],
          ['Estimated Operational Profit', report.summary.estimatedOperationalProfit],
        ];

        return {
          filename: `finance_report_${timestamp}.csv`,
          contentType: 'text/csv; charset=utf-8',
          data: this.buildCsvString(headers, rows),
        };
      }

      case 'processing': {
        const report = await this.reportsService.getProcessingReport(tenantId, branchIds, filter);
        const headers = ['Stage Name', 'Jobs Processed', 'Currently In Stage', 'Estimated Turnaround (Minutes)'];
        const rows = report.stageMetrics.map((s) => [s.stage, s.jobsProcessed, s.currentlyInStage, s.averageMinutes]);

        return {
          filename: `processing_report_${timestamp}.csv`,
          contentType: 'text/csv; charset=utf-8',
          data: this.buildCsvString(headers, rows),
        };
      }

      case 'logistics': {
        const report = await this.reportsService.getLogisticsReport(tenantId, branchIds, filter);
        const headers = ['Logistics Metric', 'Value'];
        const rows = [
          ['Total Pickup Requests', report.summary.totalPickups],
          ['Completed Pickups', report.summary.completedPickups],
          ['Pickup Success Rate (%)', `${report.summary.pickupSuccessRate}%`],
          ['Total Delivery Requests', report.summary.totalDeliveries],
          ['Completed Deliveries', report.summary.completedDeliveries],
          ['Delivery Success Rate (%)', `${report.summary.deliverySuccessRate}%`],
        ];

        return {
          filename: `logistics_report_${timestamp}.csv`,
          contentType: 'text/csv; charset=utf-8',
          data: this.buildCsvString(headers, rows),
        };
      }

      default:
        throw new BadRequestException(`Unsupported report export type: "${reportType}". Supported types: sales, orders, customers, inventory, finance, processing, logistics.`);
    }
  }
}
