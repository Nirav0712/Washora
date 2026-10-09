import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PermissionCode } from '@washora/shared';

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  private getTenantId(req: any): string {
    return req.user?.membership?.tenantId || req.user?.tenantId;
  }

  @Get('dashboard')
  @RequirePermissions(PermissionCode.FINANCE_VIEW)
  @ApiOperation({ summary: 'Get finance operational summary dashboard' })
  @ApiQuery({ name: 'branchId', required: false })
  async getDashboard(@Req() req: any, @Query('branchId') branchId?: string) {
    const tenantId = this.getTenantId(req);
    return this.financeService.getDashboard(tenantId, branchId);
  }

  @Get('reports/revenue')
  @RequirePermissions(PermissionCode.FINANCE_REPORT)
  @ApiOperation({ summary: 'Get revenue report with date and payment method breakdown' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getRevenueReport(
    @Req() req: any,
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const tenantId = this.getTenantId(req);
    return this.financeService.getRevenueReport(tenantId, { branchId, startDate, endDate });
  }

  @Get('reports/expenses')
  @RequirePermissions(PermissionCode.FINANCE_REPORT)
  @ApiOperation({ summary: 'Get expense report with category and date breakdown' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getExpenseReport(
    @Req() req: any,
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const tenantId = this.getTenantId(req);
    return this.financeService.getExpenseReport(tenantId, { branchId, startDate, endDate });
  }

  @Get('reports/profit-loss')
  @RequirePermissions(PermissionCode.FINANCE_REPORT)
  @ApiOperation({ summary: 'Get operational profit and loss report' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getProfitLossReport(
    @Req() req: any,
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const tenantId = this.getTenantId(req);
    return this.financeService.getProfitLossReport(tenantId, { branchId, startDate, endDate });
  }
}
