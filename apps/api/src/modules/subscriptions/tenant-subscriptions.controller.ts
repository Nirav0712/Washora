import {
  Controller,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, TenantGuard, PermissionsGuard } from '../../common/guards';
import { TenantSubscriptionService } from '../platform/services/tenant-subscription.service';
import { SaasUsageService } from '../platform/services/saas-usage.service';
import { SaasBillingService } from '../platform/services/saas-billing.service';

@ApiTags('Tenant Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('subscriptions')
export class TenantSubscriptionsController {
  constructor(
    private subscriptionService: TenantSubscriptionService,
    private usageService: SaasUsageService,
    private billingService: SaasBillingService,
  ) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current tenant SaaS subscription and plan details' })
  async getCurrentSubscription(@Req() req: any) {
    return this.subscriptionService.getSubscriptionByTenant(req.tenantId);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get current tenant resource usage and plan limit status' })
  async getUsage(@Req() req: any) {
    return this.usageService.getTenantUsage(req.tenantId);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get current tenant SaaS billing invoices' })
  async getInvoices(@Req() req: any) {
    return this.billingService.listInvoices({ tenantId: req.tenantId });
  }
}
