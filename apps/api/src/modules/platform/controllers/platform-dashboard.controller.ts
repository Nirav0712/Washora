import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlatformDashboardService } from '../services/platform-dashboard.service';
import { PlatformAuthGuard } from '../guards/platform-auth.guard';
import { PlatformPermissionsGuard } from '../guards/platform-permissions.guard';
import { RequirePlatformPermission } from '../decorators/require-permission.decorator';
import { PlatformPermission } from '@washora/shared';

@ApiTags('Platform Dashboard')
@Controller('platform/dashboard')
@UseGuards(PlatformAuthGuard, PlatformPermissionsGuard)
@ApiBearerAuth()
export class PlatformDashboardController {
  constructor(private dashboardService: PlatformDashboardService) {}

  @Get()
  @RequirePlatformPermission(PlatformPermission.DASHBOARD_VIEW)
  @ApiOperation({ summary: 'Get SaaS platform executive dashboard metrics and MRR/ARR KPIs' })
  async getDashboard() {
    return this.dashboardService.getDashboardData();
  }
}
