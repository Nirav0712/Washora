import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PartnersService } from '../services/partners.service';
import { PlatformAuthGuard } from '../guards/platform-auth.guard';
import { PlatformRolesGuard } from '../guards/platform-roles.guard';
import { RequirePlatformRoles } from '../decorators/require-roles.decorator';
import { CurrentAdmin } from '../decorators/current-admin.decorator';
import { PlatformAdminRole } from '@washora/shared';

@ApiTags('Platform - Partners (Super Admin)')
@ApiBearerAuth()
@UseGuards(PlatformAuthGuard, PlatformRolesGuard)
@Controller('platform/partners')
export class PlatformPartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Post()
  @RequirePlatformRoles(PlatformAdminRole.SUPER_ADMIN, PlatformAdminRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Create a new partner admin account' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Partner created successfully' })
  async createPartner(
    @Body()
    dto: {
      name: string;
      email: string;
      phone?: string;
      companyName?: string;
      code: string;
      commissionRate?: number;
      password?: string;
    },
    @CurrentAdmin() admin: any,
  ) {
    return this.partnersService.createPartner(dto, admin.id);
  }

  @Get()
  @RequirePlatformRoles(PlatformAdminRole.SUPER_ADMIN, PlatformAdminRole.PLATFORM_ADMIN, PlatformAdminRole.READ_ONLY_ADMIN)
  @ApiOperation({ summary: 'List all partner accounts with performance metrics' })
  async findAll(@Query('search') search?: string, @Query('isActive') isActive?: boolean) {
    return this.partnersService.findAll({ search, isActive });
  }

  @Get(':id')
  @RequirePlatformRoles(PlatformAdminRole.SUPER_ADMIN, PlatformAdminRole.PLATFORM_ADMIN, PlatformAdminRole.READ_ONLY_ADMIN)
  @ApiOperation({ summary: 'Get partner details and assigned shops' })
  async findById(@Param('id') id: string) {
    return this.partnersService.findById(id);
  }

  @Patch(':id')
  @RequirePlatformRoles(PlatformAdminRole.SUPER_ADMIN, PlatformAdminRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Update partner profile or commission rate' })
  async updatePartner(
    @Param('id') id: string,
    @Body() dto: { name?: string; phone?: string; companyName?: string; commissionRate?: number; isActive?: boolean },
    @CurrentAdmin() admin: any,
  ) {
    return this.partnersService.updatePartner(id, dto, admin.id);
  }

  @Post(':id/assign-tenant')
  @RequirePlatformRoles(PlatformAdminRole.SUPER_ADMIN, PlatformAdminRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Assign or reassign a laundry shop/tenant to a partner' })
  async assignTenant(
    @Param('id') partnerId: string,
    @Body('tenantId') tenantId: string,
    @CurrentAdmin() admin: any,
  ) {
    return this.partnersService.assignTenant(partnerId, tenantId, admin.id);
  }
}
