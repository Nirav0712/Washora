import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlatformReportsService } from '../services/platform-reports.service';
import { PlatformAuthGuard } from '../guards/platform-auth.guard';
import { PlatformPermissionsGuard } from '../guards/platform-permissions.guard';
import { RequirePlatformPermission } from '../decorators/require-permission.decorator';
import { PlatformPermission } from '@washora/shared';

@ApiTags('Platform Reports & Analytics')
@ApiBearerAuth()
@UseGuards(PlatformAuthGuard, PlatformPermissionsGuard)
@Controller('platform/analytics')
export class PlatformReportsController {
  constructor(private reportsService: PlatformReportsService) {}

  @Get('growth')
  @RequirePlatformPermission(PlatformPermission.DASHBOARD_VIEW)
  @ApiOperation({ summary: 'Get SaaS platform tenant growth, MRR and plan distribution analytics' })
  async getGrowthAnalytics() {
    return this.reportsService.getPlatformGrowthAnalytics();
  }
}
