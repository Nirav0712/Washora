import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PlatformAuthGuard } from '../guards/platform-auth.guard';
import { PlatformPermissionsGuard } from '../guards/platform-permissions.guard';
import { CurrentAdmin, CurrentAdminContext } from '../decorators/current-admin.decorator';
import { RequirePlatformPermission } from '../decorators/require-permission.decorator';
import { PlatformPermission } from '@washora/shared';
import { SupportService } from '../../support/support.service';
import {
  AddTicketMessageDto,
  UpdateTicketStatusDto,
  AssignTicketDto,
  UpdatePlatformContactSettingsDto,
} from '../../support/dto/support.dto';

@ApiTags('Platform Support & Helpdesk')
@Controller('platform/support')
@UseGuards(PlatformAuthGuard, PlatformPermissionsGuard)
@ApiBearerAuth()
export class PlatformSupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('tickets')
  @RequirePlatformPermission(PlatformPermission.SUPPORT_VIEW)
  @ApiOperation({ summary: 'List all support tickets across all tenants' })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getAllTickets(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.supportService.getAllTickets({
      tenantId,
      status,
      category,
      priority,
      search,
      page,
      limit,
    });
  }

  @Get('tickets/:id')
  @RequirePlatformPermission(PlatformPermission.SUPPORT_VIEW)
  @ApiOperation({ summary: 'Get full ticket details with tenant and user context' })
  async getTicketById(@Param('id') id: string) {
    return this.supportService.getPlatformTicketById(id);
  }

  @Patch('tickets/:id/status')
  @RequirePlatformPermission(PlatformPermission.SUPPORT_MANAGE)
  @ApiOperation({ summary: 'Update ticket status and resolution notes' })
  async updateStatus(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    return this.supportService.updateTicketStatus(id, dto, admin.adminId);
  }

  @Patch('tickets/:id/assign')
  @RequirePlatformPermission(PlatformPermission.SUPPORT_MANAGE)
  @ApiOperation({ summary: 'Assign ticket to platform support engineer' })
  async assignTicket(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Param('id') id: string,
    @Body() dto: AssignTicketDto,
  ) {
    return this.supportService.assignTicket(id, dto, admin.adminId);
  }

  @Post('tickets/:id/messages')
  @RequirePlatformPermission(PlatformPermission.SUPPORT_MANAGE)
  @ApiOperation({ summary: 'Post official platform agent reply to customer ticket' })
  async addAdminMessage(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Param('id') id: string,
    @Body() dto: AddTicketMessageDto,
  ) {
    return this.supportService.addPlatformAdminMessage(
      id,
      admin.adminId,
      admin.email || 'Washora Platform Engineer',
      dto,
    );
  }

  @Get('contact-info')
  @RequirePlatformPermission(PlatformPermission.SUPPORT_VIEW)
  @ApiOperation({ summary: 'Get current centralized platform contact settings' })
  async getContactInfo() {
    return this.supportService.getPlatformContactInfo();
  }

  @Patch('contact-info')
  @RequirePlatformPermission(PlatformPermission.SUPPORT_MANAGE)
  @ApiOperation({ summary: 'Update centralized customer support and sales contact info' })
  async updateContactInfo(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Body() dto: UpdatePlatformContactSettingsDto,
  ) {
    return this.supportService.updatePlatformContactInfo(dto, admin.adminId);
  }
}
