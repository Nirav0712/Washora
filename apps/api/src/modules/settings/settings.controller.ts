import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateTenantSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard, TenantGuard, PermissionsGuard } from '../../common/guards';
import { RequirePermissions } from '../../common/decorators';
import { PermissionCode } from '@washora/shared';

@ApiTags('Tenant Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current tenant settings' })
  @RequirePermissions(PermissionCode.SETTINGS_VIEW)
  async getSettings(@Req() req: any) {
    return this.settingsService.getOrCreate(req.tenantId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update tenant settings' })
  @RequirePermissions(PermissionCode.SETTINGS_MANAGE)
  async updateSettings(@Req() req: any, @Body() dto: UpdateTenantSettingsDto) {
    return this.settingsService.update(req.tenantId, dto);
  }
}
