import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TenantLifecycleService } from '../services/tenant-lifecycle.service';
import { PlatformAuthGuard } from '../guards/platform-auth.guard';
import { PlatformPermissionsGuard } from '../guards/platform-permissions.guard';
import { CurrentAdmin, CurrentAdminContext } from '../decorators/current-admin.decorator';
import { RequirePlatformPermission } from '../decorators/require-permission.decorator';
import { PlatformPermission, TenantStatus } from '@washora/shared';
import {
  ProvisionTenantDto,
  UpdateTenantAdminDto,
  TenantLifecycleActionDto,
} from '../dto/platform-tenant.dto';

@ApiTags('Platform Tenants')
@Controller('platform/tenants')
@UseGuards(PlatformAuthGuard, PlatformPermissionsGuard)
@ApiBearerAuth()
export class PlatformTenantsController {
  constructor(private lifecycleService: TenantLifecycleService) {}

  @Get()
  @RequirePlatformPermission(PlatformPermission.TENANTS_VIEW)
  @ApiOperation({ summary: 'List tenants with governance metadata and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: TenantStatus })
  @ApiQuery({ name: 'businessType', required: false, type: String })
  async listTenants(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: TenantStatus,
    @Query('businessType') businessType?: string,
  ) {
    return this.lifecycleService.listTenants({ page, limit, search, status, businessType });
  }

  @Post()
  @RequirePlatformPermission(PlatformPermission.TENANTS_CREATE)
  @ApiOperation({ summary: 'Provision a new laundry SaaS tenant' })
  async provisionTenant(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Body() dto: ProvisionTenantDto,
  ) {
    return this.lifecycleService.provisionTenant(dto, admin.adminId);
  }

  @Get(':id')
  @RequirePlatformPermission(PlatformPermission.TENANTS_VIEW)
  @ApiOperation({ summary: 'Get 360 overview of a tenant' })
  async getTenant360(@Param('id') id: string) {
    return this.lifecycleService.getTenant360(id);
  }

  @Patch(':id')
  @RequirePlatformPermission(PlatformPermission.TENANTS_UPDATE)
  @ApiOperation({ summary: 'Update tenant core metadata' })
  async updateTenant(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Param('id') id: string,
    @Body() dto: UpdateTenantAdminDto,
  ) {
    return this.lifecycleService.updateTenant(id, dto, admin.adminId);
  }

  @Post(':id/verify')
  @HttpCode(HttpStatus.OK)
  @RequirePlatformPermission(PlatformPermission.TENANTS_VERIFY)
  @ApiOperation({ summary: 'Verify or unverify tenant business legitimacy' })
  async verifyTenant(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Param('id') id: string,
    @Body('isVerified') isVerified: boolean = true,
  ) {
    return this.lifecycleService.verifyTenant(id, isVerified, admin.adminId);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @RequirePlatformPermission(PlatformPermission.TENANTS_ACTIVATE)
  @ApiOperation({ summary: 'Activate a provisioning, trial, or suspended tenant' })
  async activateTenant(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Param('id') id: string,
    @Body() dto: TenantLifecycleActionDto,
  ) {
    return this.lifecycleService.transitionStatus(id, TenantStatus.ACTIVE, dto.reason, admin.adminId);
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @RequirePlatformPermission(PlatformPermission.TENANTS_SUSPEND)
  @ApiOperation({ summary: 'Suspend a tenant due to policy or payment violation' })
  async suspendTenant(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Param('id') id: string,
    @Body() dto: TenantLifecycleActionDto,
  ) {
    return this.lifecycleService.transitionStatus(id, TenantStatus.SUSPENDED, dto.reason, admin.adminId);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @RequirePlatformPermission(PlatformPermission.TENANTS_UPDATE)
  @ApiOperation({ summary: 'Cancel tenant account' })
  async cancelTenant(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Param('id') id: string,
    @Body() dto: TenantLifecycleActionDto,
  ) {
    return this.lifecycleService.transitionStatus(id, TenantStatus.CANCELLED, dto.reason, admin.adminId);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @RequirePlatformPermission(PlatformPermission.TENANTS_ARCHIVE)
  @ApiOperation({ summary: 'Archive tenant into terminal state' })
  async archiveTenant(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Param('id') id: string,
    @Body() dto: TenantLifecycleActionDto,
  ) {
    return this.lifecycleService.transitionStatus(id, TenantStatus.ARCHIVED, dto.reason, admin.adminId);
  }

  @Post(':id/impersonate')
  @HttpCode(HttpStatus.OK)
  @RequirePlatformPermission(PlatformPermission.TENANTS_IMPERSONATE)
  @ApiOperation({ summary: 'Create a delegated support access session to login as the shop owner' })
  async impersonateTenant(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Param('id') id: string,
  ) {
    return this.lifecycleService.impersonateTenant(id, admin);
  }

  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  @RequirePlatformPermission(PlatformPermission.TENANTS_UPDATE)
  @ApiOperation({ summary: 'Generate a secure temporary password for the shop owner' })
  async resetTenantPassword(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Param('id') id: string,
  ) {
    return this.lifecycleService.resetTenantPassword(id, admin);
  }
}
