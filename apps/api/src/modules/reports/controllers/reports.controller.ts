import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Req,
  Res,
  ForbiddenException,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from '../services/reports.service';
import { ReportsExportService } from '../services/reports-export.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermissionCode, RoleType } from '@washora/shared';
import { ReportFilterDto, ExportReportDto } from '../dto/reports-query.dto';

@ApiTags('Reports & Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private reportsService: ReportsService,
    private exportService: ReportsExportService,
  ) {}

  private resolveTenantAndBranches(req: any, queryBranchId?: string): { tenantId: string; branchIds?: string | string[] } {
    const tenantId = req.user?.tenantId?.toString() || req.user?.membership?.tenantId?.toString() || req.tenantId?.toString();
    if (!tenantId) {
      throw new ForbiddenException('Tenant context could not be resolved from authentication token');
    }

    const roleType = req.user?.role || req.user?.roleType || req.user?.membership?.role?.code;
    const userBranchIds = (req.user?.branchIds || req.user?.membership?.branchIds || []).map((b: any) => b.toString());

    // If query requests specific branch
    if (queryBranchId) {
      // Shop Owner / Super Admin has access to all branches
      if (roleType === RoleType.SHOP_OWNER || roleType === RoleType.SUPER_ADMIN) {
        return { tenantId, branchIds: queryBranchId };
      }

      // Verify branch is in user's permitted branchIds
      if (userBranchIds.length > 0 && !userBranchIds.includes(queryBranchId)) {
        throw new ForbiddenException(`You do not have authorization to view reports for branch: ${queryBranchId}`);
      }

      return { tenantId, branchIds: queryBranchId };
    }

    // If no specific branch queried:
    // If user has restricted branches (e.g. Branch Manager assigned to 1 branch)
    if (userBranchIds.length > 0 && roleType !== RoleType.SHOP_OWNER && roleType !== RoleType.SUPER_ADMIN) {
      return { tenantId, branchIds: userBranchIds };
    }

    // Otherwise tenant-wide
    return { tenantId };
  }

  @Get('dashboard')
  @RequirePermissions(PermissionCode.REPORT_VIEW)
  @ApiOperation({ summary: 'Get Executive BI Dashboard KPIs, timeline and bottlenecks' })
  async getDashboard(@Req() req: any, @Query() filter: ReportFilterDto) {
    const { tenantId, branchIds } = this.resolveTenantAndBranches(req, filter.branchId);
    return this.reportsService.getDashboard(tenantId, branchIds, filter);
  }

  @Get('sales')
  @RequirePermissions(PermissionCode.REPORT_VIEW)
  @ApiOperation({ summary: 'Get comprehensive sales report with breakdown by branch, category and payment method' })
  async getSalesReport(@Req() req: any, @Query() filter: ReportFilterDto) {
    const { tenantId, branchIds } = this.resolveTenantAndBranches(req, filter.branchId);
    return this.reportsService.getSalesReport(tenantId, branchIds, filter);
  }

  @Get('orders')
  @RequirePermissions(PermissionCode.REPORT_VIEW)
  @ApiOperation({ summary: 'Get order lifecycle status distribution, bottlenecks and speed ratio' })
  async getOrdersReport(@Req() req: any, @Query() filter: ReportFilterDto) {
    const { tenantId, branchIds } = this.resolveTenantAndBranches(req, filter.branchId);
    return this.reportsService.getOrdersReport(tenantId, branchIds, filter);
  }

  @Get('customers')
  @RequirePermissions(PermissionCode.REPORT_VIEW)
  @ApiOperation({ summary: 'Get customer analytics, segmentation rules and retention cohorts' })
  async getCustomersReport(@Req() req: any, @Query() filter: ReportFilterDto) {
    const { tenantId, branchIds } = this.resolveTenantAndBranches(req, filter.branchId);
    return this.reportsService.getCustomersReport(tenantId, branchIds, filter);
  }

  @Get('services')
  @RequirePermissions(PermissionCode.REPORT_VIEW)
  @ApiOperation({ summary: 'Get top revenue services, products and category performance' })
  async getServicesReport(@Req() req: any, @Query() filter: ReportFilterDto) {
    const { tenantId, branchIds } = this.resolveTenantAndBranches(req, filter.branchId);
    return this.reportsService.getServicesReport(tenantId, branchIds, filter);
  }

  @Get('branches')
  @RequirePermissions(PermissionCode.REPORT_VIEW)
  @ApiOperation({ summary: 'Get multi-branch comparative performance rankings' })
  async getBranchesReport(@Req() req: any, @Query() filter: ReportFilterDto) {
    const { tenantId, branchIds } = this.resolveTenantAndBranches(req, filter.branchId);
    return this.reportsService.getBranchesReport(tenantId, branchIds, filter);
  }

  @Get('payments')
  @RequirePermissions(PermissionCode.REPORT_VIEW)
  @ApiOperation({ summary: 'Get payment collection and payment method breakdown' })
  async getPaymentsReport(@Req() req: any, @Query() filter: ReportFilterDto) {
    const { tenantId, branchIds } = this.resolveTenantAndBranches(req, filter.branchId);
    return this.reportsService.getPaymentsReport(tenantId, branchIds, filter);
  }

  @Get('finance')
  @RequirePermissions(PermissionCode.REPORT_VIEW, PermissionCode.FINANCE_VIEW)
  @ApiOperation({ summary: 'Get operational finance P&L and cash flow breakdown' })
  async getFinanceReport(@Req() req: any, @Query() filter: ReportFilterDto) {
    const { tenantId, branchIds } = this.resolveTenantAndBranches(req, filter.branchId);
    return this.reportsService.getFinanceReport(tenantId, branchIds, filter);
  }

  @Get('expenses')
  @RequirePermissions(PermissionCode.REPORT_VIEW)
  @ApiOperation({ summary: 'Get expense analytics by category and branch' })
  async getExpensesReport(@Req() req: any, @Query() filter: ReportFilterDto) {
    const { tenantId, branchIds } = this.resolveTenantAndBranches(req, filter.branchId);
    return this.reportsService.getExpensesReport(tenantId, branchIds, filter);
  }

  @Get('inventory')
  @RequirePermissions(PermissionCode.REPORT_VIEW)
  @ApiOperation({ summary: 'Get inventory stock valuation, consumption and low-stock alerts' })
  async getInventoryReport(@Req() req: any, @Query() filter: ReportFilterDto) {
    const { tenantId, branchIds } = this.resolveTenantAndBranches(req, filter.branchId);
    return this.reportsService.getInventoryReport(tenantId, branchIds);
  }

  @Get('suppliers')
  @RequirePermissions(PermissionCode.REPORT_VIEW)
  @ApiOperation({ summary: 'Get supplier purchase volume and payables' })
  async getSuppliersReport(@Req() req: any) {
    const tenantId = req.user?.membership?.tenantId?.toString() || req.user?.tenantId?.toString();
    return this.reportsService.getSuppliersReport(tenantId);
  }

  @Get('processing')
  @RequirePermissions(PermissionCode.REPORT_VIEW)
  @ApiOperation({ summary: 'Get plant processing throughput, cycle time and stage metrics' })
  async getProcessingReport(@Req() req: any, @Query() filter: ReportFilterDto) {
    const { tenantId, branchIds } = this.resolveTenantAndBranches(req, filter.branchId);
    return this.reportsService.getProcessingReport(tenantId, branchIds, filter);
  }

  @Get('qc')
  @RequirePermissions(PermissionCode.REPORT_VIEW)
  @ApiOperation({ summary: 'Get quality check pass rate and garment defect categorization' })
  async getQcReport(@Req() req: any, @Query() filter: ReportFilterDto) {
    const { tenantId, branchIds } = this.resolveTenantAndBranches(req, filter.branchId);
    return this.reportsService.getQcReport(tenantId, branchIds, filter);
  }

  @Get('staff')
  @RequirePermissions(PermissionCode.REPORT_VIEW)
  @ApiOperation({ summary: 'Get staff attendance and operational workload metrics' })
  async getStaffReport(@Req() req: any, @Query() filter: ReportFilterDto) {
    const { tenantId, branchIds } = this.resolveTenantAndBranches(req, filter.branchId);
    return this.reportsService.getStaffReport(tenantId, branchIds);
  }

  @Get('logistics')
  @RequirePermissions(PermissionCode.REPORT_VIEW)
  @ApiOperation({ summary: 'Get pickup and delivery logistics success rates' })
  async getLogisticsReport(@Req() req: any, @Query() filter: ReportFilterDto) {
    const { tenantId, branchIds } = this.resolveTenantAndBranches(req, filter.branchId);
    return this.reportsService.getLogisticsReport(tenantId, branchIds, filter);
  }

  @Get('notifications')
  @RequirePermissions(PermissionCode.REPORT_VIEW)
  @ApiOperation({ summary: 'Get automated notification delivery rates by channel' })
  async getNotificationsReport(@Req() req: any, @Query() filter: ReportFilterDto) {
    const tenantId = req.user?.membership?.tenantId?.toString() || req.user?.tenantId?.toString();
    return this.reportsService.getNotificationsReport(tenantId, filter);
  }

  @Get('export/:reportType')
  @RequirePermissions(PermissionCode.REPORT_VIEW)
  @ApiOperation({ summary: 'Export report data in standard CSV format' })
  async exportReport(
    @Req() req: any,
    @Res() res: Response,
    @Param('reportType') reportType: string,
    @Query() filter: ExportReportDto,
  ) {
    const { tenantId, branchIds } = this.resolveTenantAndBranches(req, filter.branchId);
    const exportResult = await this.exportService.exportReportToCsv(reportType, tenantId, branchIds, filter);

    res.setHeader('Content-Type', exportResult.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    return res.send(exportResult.data);
  }
}
