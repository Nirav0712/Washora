import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard, TenantGuard, PermissionsGuard } from '../../common/guards';
import { RequirePermissions } from '../../common/decorators';
import { PermissionCode } from '@washora/shared';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current tenant details' })
  @RequirePermissions(PermissionCode.TENANT_VIEW)
  async getCurrentTenant(@Req() req: any) {
    return this.tenantsService.findById(req.tenantId);
  }

  @Patch('current')
  @ApiOperation({ summary: 'Update current tenant details' })
  @RequirePermissions(PermissionCode.TENANT_UPDATE)
  async updateCurrentTenant(@Req() req: any, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(req.tenantId, req.user.userId, dto);
  }
}
