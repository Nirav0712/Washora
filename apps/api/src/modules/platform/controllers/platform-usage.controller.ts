import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SaasUsageService } from '../services/saas-usage.service';
import { PlatformAuthGuard } from '../guards/platform-auth.guard';
import { PlatformPermissionsGuard } from '../guards/platform-permissions.guard';
import { RequirePlatformPermission } from '../decorators/require-permission.decorator';
import { PlatformPermission } from '@washora/shared';

@ApiTags('Platform Usage')
@Controller('platform/usage')
@UseGuards(PlatformAuthGuard, PlatformPermissionsGuard)
@ApiBearerAuth()
export class PlatformUsageController {
  constructor(private usageService: SaasUsageService) {}

  @Get()
  @RequirePlatformPermission(PlatformPermission.USAGE_VIEW)
  @ApiOperation({ summary: 'List usage metrics across all tenants' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllUsage(@Query('limit') limit?: number) {
    return this.usageService.getAllTenantsUsageSummary(limit);
  }

  @Get(':tenantId')
  @RequirePlatformPermission(PlatformPermission.USAGE_VIEW)
  @ApiOperation({ summary: 'Get detailed usage summary and limit utilization for a specific tenant' })
  async getTenantUsage(@Param('tenantId') tenantId: string) {
    return this.usageService.getTenantUsage(tenantId);
  }
}
