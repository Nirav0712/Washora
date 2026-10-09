import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SaasBillingService } from '../services/saas-billing.service';
import { PlatformAuthGuard } from '../guards/platform-auth.guard';
import { PlatformPermissionsGuard } from '../guards/platform-permissions.guard';
import { CurrentAdmin, CurrentAdminContext } from '../decorators/current-admin.decorator';
import { RequirePlatformPermission } from '../decorators/require-permission.decorator';
import { PlatformPermission, BillingInvoiceStatus } from '@washora/shared';
import {
  CreateBillingInvoiceDto,
  RecordBillingPaymentDto,
  ProcessWebhookDto,
} from '../dto/saas-billing.dto';

@ApiTags('Platform Billing')
@Controller('platform/billing')
export class PlatformBillingController {
  constructor(private billingService: SaasBillingService) {}

  @Get('invoices')
  @UseGuards(PlatformAuthGuard, PlatformPermissionsGuard)
  @RequirePlatformPermission(PlatformPermission.BILLING_VIEW)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List SaaS platform billing invoices' })
  @ApiQuery({ name: 'tenantId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: BillingInvoiceStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listInvoices(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: BillingInvoiceStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.billingService.listInvoices({ tenantId, status, page, limit });
  }

  @Post('invoices')
  @UseGuards(PlatformAuthGuard, PlatformPermissionsGuard)
  @RequirePlatformPermission(PlatformPermission.BILLING_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a new SaaS platform invoice' })
  async createInvoice(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Body() dto: CreateBillingInvoiceDto,
  ) {
    return this.billingService.createInvoice(dto, admin.adminId);
  }

  @Get('invoices/:id')
  @UseGuards(PlatformAuthGuard, PlatformPermissionsGuard)
  @RequirePlatformPermission(PlatformPermission.BILLING_VIEW)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get SaaS billing invoice details by ID' })
  async getInvoiceById(@Param('id') id: string) {
    return this.billingService.getInvoiceById(id);
  }

  @Get('payments')
  @UseGuards(PlatformAuthGuard, PlatformPermissionsGuard)
  @RequirePlatformPermission(PlatformPermission.BILLING_VIEW)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List SaaS platform payments' })
  @ApiQuery({ name: 'tenantId', required: false, type: String })
  @ApiQuery({ name: 'invoiceId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listPayments(
    @Query('tenantId') tenantId?: string,
    @Query('invoiceId') invoiceId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.billingService.listPayments({ tenantId, invoiceId, page, limit });
  }

  @Post('payments')
  @UseGuards(PlatformAuthGuard, PlatformPermissionsGuard)
  @RequirePlatformPermission(PlatformPermission.BILLING_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record a SaaS billing payment manually' })
  async recordPayment(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Body() dto: RecordBillingPaymentDto,
  ) {
    return this.billingService.recordPayment(dto, admin.adminId);
  }

  @Get('overview')
  @UseGuards(PlatformAuthGuard, PlatformPermissionsGuard)
  @RequirePlatformPermission(PlatformPermission.BILLING_VIEW)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get SaaS billing revenue and invoice overview metrics' })
  async getBillingOverview() {
    return this.billingService.getBillingOverview();
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process gateway payment webhook event (Idempotent)' })
  async handleWebhook(@Body() dto: ProcessWebhookDto, @Req() req: any) {
    return this.billingService.handleWebhook(dto, req.body);
  }
}
