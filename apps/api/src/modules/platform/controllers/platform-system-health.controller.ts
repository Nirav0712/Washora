import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SystemHealthService } from '../services/system-health.service';
import { PlatformAuthGuard } from '../guards/platform-auth.guard';
import { PlatformPermissionsGuard } from '../guards/platform-permissions.guard';
import { RequirePlatformPermission } from '../decorators/require-permission.decorator';
import { PlatformPermission } from '@washora/shared';

@ApiTags('Platform System Health')
@Controller('platform/system-health')
@UseGuards(PlatformAuthGuard, PlatformPermissionsGuard)
@ApiBearerAuth()
export class PlatformSystemHealthController {
  constructor(private healthService: SystemHealthService) {}

  @Get()
  @RequirePlatformPermission(PlatformPermission.SYSTEM_HEALTH_VIEW)
  @ApiOperation({ summary: 'Get safe infrastructure and operational health metrics' })
  async getHealth() {
    return this.healthService.getHealth();
  }
}
