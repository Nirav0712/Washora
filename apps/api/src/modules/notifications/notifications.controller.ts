import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService, NotificationFilterParams } from './notifications.service';
import {
  NotificationTemplateService,
  CreateTemplateDto,
  UpdateTemplateDto,
} from './notification-template.service';
import {
  WhatsAppSettingsService,
  UpdateWhatsAppSettingsDto,
} from './whatsapp-settings.service';
import {
  NotificationPreferenceService,
  UpdatePreferencesDto,
} from './notification-preference.service';
import { NotificationAutomationService } from './notification-automation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import {
  PermissionCode,
  NotificationChannel,
  NotificationEventType,
  NotificationStatus,
  NotificationAutomationRule,
} from '@washora/shared';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notifService: NotificationsService,
    private readonly templateService: NotificationTemplateService,
    private readonly whatsappSettingsService: WhatsAppSettingsService,
    private readonly preferenceService: NotificationPreferenceService,
    private readonly automationService: NotificationAutomationService,
  ) {}

  private getTenantId(req: any): string {
    return req.user?.membership?.tenantId || req.user?.tenantId;
  }

  private getUserId(req: any): string {
    return req.user?._id || req.user?.id || req.user?.userId;
  }

  // ==========================================
  // WEBHOOKS (Public / Provider Authenticated)
  // ==========================================

  @Get('webhooks/whatsapp')
  @ApiOperation({ summary: 'Meta Webhook Challenge Verification' })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.challenge') challenge: string,
    @Query('hub.verify_token') token: string,
    @Res() res: any,
  ) {
    if (mode === 'subscribe') {
      return res.status(200).send(challenge);
    }
    return res.status(200).send('OK');
  }

  @Post('webhooks/whatsapp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Meta WhatsApp Status & Message Webhook Callback' })
  async handleWhatsAppWebhook(
    @Body() payload: any,
    @Headers() headers: Record<string, string>,
  ) {
    return this.notifService.handleWebhook(
      NotificationChannel.WHATSAPP,
      payload,
      headers,
    );
  }

  // ==========================================
  // TEMPLATES
  // ==========================================

  @Get('templates')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PermissionCode.NOTIFICATION_TEMPLATE_VIEW)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List notification templates for tenant' })
  async listTemplates(
    @Req() req: any,
    @Query('branchId') branchId?: string,
    @Query('eventType') eventType?: NotificationEventType,
    @Query('channel') channel?: NotificationChannel,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    const tenantId = this.getTenantId(req);
    return this.templateService.findAll(tenantId, {
      branchId,
      eventType,
      channel,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search,
    });
  }

  @Post('templates')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PermissionCode.NOTIFICATION_TEMPLATE_CREATE)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new notification template' })
  async createTemplate(@Req() req: any, @Body() dto: CreateTemplateDto) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.templateService.create(tenantId, dto, userId);
  }

  @Get('templates/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PermissionCode.NOTIFICATION_TEMPLATE_VIEW)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get template by ID' })
  async getTemplateById(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    return this.templateService.findById(tenantId, id);
  }

  @Patch('templates/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PermissionCode.NOTIFICATION_TEMPLATE_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update notification template' })
  async updateTemplate(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.templateService.update(tenantId, id, dto, userId);
  }

  @Post('templates/:id/enable')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PermissionCode.NOTIFICATION_TEMPLATE_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable template' })
  async enableTemplate(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.templateService.setStatus(tenantId, id, true, userId);
  }

  @Post('templates/:id/disable')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PermissionCode.NOTIFICATION_TEMPLATE_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable template' })
  async disableTemplate(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.templateService.setStatus(tenantId, id, false, userId);
  }

  // ==========================================
  // WHATSAPP SETTINGS
  // ==========================================

  @Get('settings/whatsapp')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PermissionCode.NOTIFICATION_SETTINGS_VIEW)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tenant WhatsApp settings' })
  async getWhatsAppSettings(@Req() req: any) {
    const tenantId = this.getTenantId(req);
    return this.whatsappSettingsService.getSettings(tenantId);
  }

  @Patch('settings/whatsapp')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PermissionCode.NOTIFICATION_SETTINGS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tenant WhatsApp settings' })
  async updateWhatsAppSettings(
    @Req() req: any,
    @Body() dto: UpdateWhatsAppSettingsDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.whatsappSettingsService.updateSettings(tenantId, dto, userId);
  }

  // ==========================================
  // CUSTOMER PREFERENCES
  // ==========================================

  @Get('preferences/:customerId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PermissionCode.NOTIFICATION_VIEW)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer notification preferences' })
  async getCustomerPreferences(
    @Req() req: any,
    @Param('customerId') customerId: string,
  ) {
    const tenantId = this.getTenantId(req);
    return this.preferenceService.getPreferences(tenantId, customerId);
  }

  @Patch('preferences/:customerId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PermissionCode.NOTIFICATION_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update customer notification preferences' })
  async updateCustomerPreferences(
    @Req() req: any,
    @Param('customerId') customerId: string,
    @Body() dto: UpdatePreferencesDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.preferenceService.updatePreferences(
      tenantId,
      customerId,
      dto,
      userId,
    );
  }

  // ==========================================
  // AUTOMATION RULES
  // ==========================================

  @Get('automation')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PermissionCode.NOTIFICATION_SETTINGS_VIEW)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tenant notification automation configuration' })
  async getAutomation(@Req() req: any) {
    const tenantId = this.getTenantId(req);
    return this.automationService.getAutomation(tenantId);
  }

  @Patch('automation')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PermissionCode.NOTIFICATION_SETTINGS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tenant notification automation rules' })
  async updateAutomation(
    @Req() req: any,
    @Body('rules') rules: NotificationAutomationRule[],
  ) {
    const tenantId = this.getTenantId(req);
    return this.automationService.updateAutomation(tenantId, rules || []);
  }

  // ==========================================
  // NOTIFICATIONS LIST & STATS
  // ==========================================

  @Get('stats')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PermissionCode.NOTIFICATION_VIEW)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notification overview stats' })
  async getStats(@Req() req: any, @Query('branchId') branchId?: string) {
    const tenantId = this.getTenantId(req);
    return this.notifService.getStats(tenantId, branchId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PermissionCode.NOTIFICATION_VIEW)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List notifications with filters and pagination' })
  async list(
    @Req() req: any,
    @Query() query: NotificationFilterParams,
  ) {
    const tenantId = this.getTenantId(req);
    return this.notifService.findAll(tenantId, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PermissionCode.NOTIFICATION_VIEW)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notification details by ID' })
  async getById(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    return this.notifService.findById(tenantId, id);
  }

  @Post(':id/resend')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PermissionCode.NOTIFICATION_RESEND)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend notification' })
  async resend(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.notifService.resend(tenantId, id, userId);
  }
}
