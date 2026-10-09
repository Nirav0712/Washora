import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LogisticsService } from './logistics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PermissionCode } from '@washora/shared';

@ApiTags('Logistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('logistics')
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  private getTenantId(req: any): string {
    return req.user?.membership?.tenantId || req.user?.tenantId;
  }

  private getUserId(req: any): string {
    return req.user?._id || req.user?.id || req.user?.userId;
  }

  @Get('dashboard')
  @RequirePermissions(PermissionCode.DELIVERY_VIEW)
  @ApiOperation({ summary: 'Get operational logistics dashboard metrics' })
  @ApiQuery({ name: 'branchId', required: false })
  async getDashboard(@Req() req: any, @Query('branchId') branchId?: string) {
    const tenantId = this.getTenantId(req);
    return this.logisticsService.getDashboard(tenantId, branchId);
  }

  @Get('agents')
  @RequirePermissions(PermissionCode.DELIVERY_VIEW)
  @ApiOperation({ summary: 'Get delivery agents workload and performance summary' })
  @ApiQuery({ name: 'branchId', required: false })
  async getAgentWorkload(@Req() req: any, @Query('branchId') branchId?: string) {
    const tenantId = this.getTenantId(req);
    return this.logisticsService.getAgentWorkload(tenantId, branchId);
  }

  @Get('my-jobs')
  @RequirePermissions(PermissionCode.DELIVERY_VIEW)
  @ApiOperation({ summary: 'Get assigned jobs for currently logged in delivery agent' })
  @ApiQuery({ name: 'date', required: false })
  async getMyJobs(@Req() req: any, @Query('date') date?: string) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.logisticsService.getMyJobs(tenantId, userId, date);
  }
}
