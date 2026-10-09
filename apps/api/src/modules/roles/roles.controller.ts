import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PermissionCode } from '@washora/shared';

@ApiTags('Roles & RBAC Management (Shop Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('permissions/catalog')
  @RequirePermissions(PermissionCode.ROLE_VIEW, PermissionCode.ROLE_MANAGE)
  @ApiOperation({ summary: 'Get full catalog of configurable permissions grouped by category' })
  getPermissionCatalog() {
    return this.rolesService.getPermissionCatalog();
  }

  @Get()
  @RequirePermissions(PermissionCode.ROLE_VIEW, PermissionCode.ROLE_MANAGE)
  @ApiOperation({ summary: 'List all roles (system default and custom) for current tenant' })
  async getTenantRoles(@Req() req: any) {
    const rawId = req.tenantId || req.user?.tenantId;
    const tenantId = new Types.ObjectId(rawId);
    return this.rolesService.findByTenant(tenantId);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.ROLE_VIEW, PermissionCode.ROLE_MANAGE)
  @ApiOperation({ summary: 'Get role details and assigned permission list' })
  async getRoleById(@Param('id') id: string) {
    return this.rolesService.findById(id);
  }

  @Post()
  @RequirePermissions(PermissionCode.ROLE_MANAGE)
  @ApiOperation({ summary: 'Create a custom role with granular permissions for current tenant' })
  async createCustomRole(
    @Req() req: any,
    @Body() dto: { name: string; description?: string; permissions: string[] },
  ) {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Role name is required');
    }
    const rawId = req.tenantId || req.user?.tenantId;
    const tenantId = new Types.ObjectId(rawId);
    return this.rolesService.createCustomRole(tenantId, dto);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.ROLE_MANAGE)
  @ApiOperation({ summary: 'Update custom role details and permissions' })
  async updateCustomRole(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: { name?: string; description?: string; permissions?: string[] },
  ) {
    const rawId = req.tenantId || req.user?.tenantId;
    const tenantId = new Types.ObjectId(rawId);
    return this.rolesService.updateCustomRole(id, tenantId, dto);
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.ROLE_MANAGE)
  @ApiOperation({ summary: 'Delete custom role' })
  async deleteCustomRole(@Param('id') id: string, @Req() req: any) {
    const rawId = req.tenantId || req.user?.tenantId;
    const tenantId = new Types.ObjectId(rawId);
    return this.rolesService.deleteCustomRole(id, tenantId);
  }
}
