import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { SupportService } from './support.service';
import {
  CreateSupportTicketDto,
  AddTicketMessageDto,
} from './dto/support.dto';

@ApiTags('Customer Support & In-App Messaging')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('contact-info')
  @ApiOperation({ summary: 'Get Washora official customer support and sales contact info' })
  async getContactInfo() {
    return this.supportService.getPlatformContactInfo();
  }

  @Post('tickets')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new support ticket' })
  async createTicket(@Req() req: any, @Body() dto: CreateSupportTicketDto) {
    const tenantId = req.tenantId || req.user?.tenantId;
    const userId = req.user?._id || req.user?.id || req.user?.userId;
    const userName = req.user?.name || req.user?.email || 'Shop Staff';
    return this.supportService.createTicket(tenantId, userId, userName, dto);
  }

  @Get('tickets')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List support tickets for authenticated tenant' })
  async getTickets(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const tenantId = req.tenantId || req.user?.tenantId;
    return this.supportService.getTenantTickets(tenantId, {
      status,
      category,
      priority,
      search,
      page,
      limit,
    });
  }

  @Get('tickets/:id')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get support ticket details and conversation thread' })
  async getTicketById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantId || req.user?.tenantId;
    return this.supportService.getTenantTicketById(tenantId, id);
  }

  @Post('tickets/:id/messages')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send message reply inside support ticket' })
  async addMessage(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: AddTicketMessageDto,
  ) {
    const tenantId = req.tenantId || req.user?.tenantId;
    const userId = req.user?._id || req.user?.id || req.user?.userId;
    const userName = req.user?.name || req.user?.email || 'Shop Staff';
    return this.supportService.addTenantMessage(tenantId, id, userId, userName, dto);
  }
}
