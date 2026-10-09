import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PartnersService } from '../services/partners.service';
import { PlatformAuthGuard } from '../guards/platform-auth.guard';
import { PlatformRolesGuard } from '../guards/platform-roles.guard';
import { RequirePlatformRoles } from '../decorators/require-roles.decorator';
import { CurrentAdmin } from '../decorators/current-admin.decorator';
import { PlatformAdminRole, BusinessType } from '@washora/shared';

@ApiTags('Partner Portal (Company / Regional Sales Partner)')
@ApiBearerAuth()
@UseGuards(PlatformAuthGuard, PlatformRolesGuard)
@Controller('partner')
export class PartnerPortalController {
  constructor(private readonly partnersService: PartnersService) {}

  private resolvePartnerId(admin: any): string {
    if (admin.role === PlatformAdminRole.SUPER_ADMIN || admin.role === PlatformAdminRole.PLATFORM_ADMIN) {
      return admin.partnerId || admin.id;
    }
    if (!admin.partnerId) {
      throw new ForbiddenException('No partner account associated with this login');
    }
    return admin.partnerId.toString();
  }

  @Get('dashboard')
  @RequirePlatformRoles(PlatformAdminRole.PARTNER_ADMIN, PlatformAdminRole.SUPER_ADMIN, PlatformAdminRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get partner portal dashboard and assigned shop metrics' })
  async getDashboard(@CurrentAdmin() admin: any) {
    const partnerId = this.resolvePartnerId(admin);
    return this.partnersService.getPartnerDashboard(partnerId);
  }

  @Get('clients')
  @RequirePlatformRoles(PlatformAdminRole.PARTNER_ADMIN, PlatformAdminRole.SUPER_ADMIN, PlatformAdminRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'List all clients/shops assigned to this partner' })
  async getClients(@CurrentAdmin() admin: any) {
    const partnerId = this.resolvePartnerId(admin);
    return this.partnersService.getPartnerClients(partnerId);
  }

  @Get('clients/:tenantId')
  @RequirePlatformRoles(PlatformAdminRole.PARTNER_ADMIN, PlatformAdminRole.SUPER_ADMIN, PlatformAdminRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get details and subscription status of an assigned client' })
  async getClientDetail(@Param('tenantId') tenantId: string, @CurrentAdmin() admin: any) {
    const partnerId = this.resolvePartnerId(admin);
    return this.partnersService.getPartnerClientDetail(partnerId, tenantId);
  }

  @Post('onboard-client')
  @RequirePlatformRoles(PlatformAdminRole.PARTNER_ADMIN, PlatformAdminRole.SUPER_ADMIN, PlatformAdminRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Onboard a new laundry shop directly under this partner' })
  async onboardClient(
    @Body()
    dto: {
      shopName: string;
      ownerName: string;
      ownerEmail: string;
      ownerPhone: string;
      password?: string;
      businessType?: BusinessType;
      planSlug?: string;
    },
    @CurrentAdmin() admin: any,
  ) {
    const partnerId = this.resolvePartnerId(admin);
    return this.partnersService.onboardClientUnderPartner(partnerId, dto);
  }
}
