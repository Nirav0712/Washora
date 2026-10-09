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
import { TenantSubscriptionService } from '../services/tenant-subscription.service';
import { PlatformAuthGuard } from '../guards/platform-auth.guard';
import { PlatformPermissionsGuard } from '../guards/platform-permissions.guard';
import { CurrentAdmin, CurrentAdminContext } from '../decorators/current-admin.decorator';
import { RequirePlatformPermission } from '../decorators/require-permission.decorator';
import { PlatformPermission, SubscriptionStatus, BillingInterval } from '@washora/shared';
import {
  CreateSubscriptionDto,
  ChangePlanDto,
  ManualSubscriptionUpdateDto,
} from '../dto/tenant-subscription.dto';

@ApiTags('Platform Subscriptions')
@Controller('platform/subscriptions')
@UseGuards(PlatformAuthGuard, PlatformPermissionsGuard)
@ApiBearerAuth()
export class PlatformSubscriptionsController {
  constructor(private subscriptionService: TenantSubscriptionService) {}

  @Get()
  @RequirePlatformPermission(PlatformPermission.SUBSCRIPTIONS_VIEW)
  @ApiOperation({ summary: 'List tenant subscriptions with filtering & pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'tenantId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: SubscriptionStatus })
  @ApiQuery({ name: 'planId', required: false, type: String })
  async listSubscriptions(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: SubscriptionStatus,
    @Query('planId') planId?: string,
  ) {
    return this.subscriptionService.listSubscriptions({ page, limit, tenantId, status, planId });
  }

  @Post()
  @RequirePlatformPermission(PlatformPermission.SUBSCRIPTIONS_CREATE)
  @ApiOperation({ summary: 'Create or attach a new subscription to a tenant' })
  async createSubscription(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptionService.createSubscription(dto, admin.adminId);
  }

  @Get(':id')
  @RequirePlatformPermission(PlatformPermission.SUBSCRIPTIONS_VIEW)
  @ApiOperation({ summary: 'Get subscription details by ID' })
  async getSubscriptionById(@Param('id') id: string) {
    return this.subscriptionService.getSubscriptionById(id);
  }

  @Get(':id/history')
  @RequirePlatformPermission(PlatformPermission.SUBSCRIPTIONS_VIEW)
  @ApiOperation({ summary: 'Get subscription lifecycle & plan change audit history' })
  async getSubscriptionHistory(@Param('id') id: string) {
    return this.subscriptionService.getSubscriptionHistory(id);
  }

  @Post(':id/change-plan')
  @HttpCode(HttpStatus.OK)
  @RequirePlatformPermission(PlatformPermission.SUBSCRIPTIONS_CHANGE_PLAN)
  @ApiOperation({ summary: 'Upgrade or downgrade subscription plan' })
  async changePlan(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Param('id') id: string,
    @Body() dto: ChangePlanDto,
  ) {
    const sub = await this.subscriptionService.getSubscriptionById(id);
    return this.subscriptionService.changePlan(sub.tenantId.toString(), dto, admin.adminId, 'PLATFORM_ADMIN');
  }

  @Post(':id/convert-trial')
  @HttpCode(HttpStatus.OK)
  @RequirePlatformPermission(PlatformPermission.SUBSCRIPTIONS_UPDATE)
  @ApiOperation({ summary: 'Convert trialing subscription to active paid subscription' })
  async convertTrial(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Param('id') id: string,
    @Body('billingInterval') billingInterval?: BillingInterval,
  ) {
    const sub = await this.subscriptionService.getSubscriptionById(id);
    return this.subscriptionService.convertTrialToPaid(sub.tenantId.toString(), billingInterval, admin.adminId);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @RequirePlatformPermission(PlatformPermission.SUBSCRIPTIONS_CANCEL)
  @ApiOperation({ summary: 'Cancel subscription (immediate or at period end)' })
  async cancelSubscription(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Param('id') id: string,
    @Body('immediate') immediate: boolean = false,
    @Body('reason') reason?: string,
  ) {
    const sub = await this.subscriptionService.getSubscriptionById(id);
    return this.subscriptionService.cancelSubscription(sub.tenantId.toString(), immediate, reason, admin.adminId);
  }

  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  @RequirePlatformPermission(PlatformPermission.SUBSCRIPTIONS_UPDATE)
  @ApiOperation({ summary: 'Reactivate a cancelled or paused subscription' })
  async reactivateSubscription(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Param('id') id: string,
  ) {
    const sub = await this.subscriptionService.getSubscriptionById(id);
    return this.subscriptionService.reactivateSubscription(sub.tenantId.toString(), admin.adminId);
  }

  @Patch(':id/manual')
  @RequirePlatformPermission(PlatformPermission.SUBSCRIPTIONS_UPDATE)
  @ApiOperation({ summary: 'Manually adjust subscription periods or state (Admin override)' })
  async manualSubscriptionUpdate(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Param('id') id: string,
    @Body() dto: ManualSubscriptionUpdateDto,
  ) {
    return this.subscriptionService.updateManualSubscription(id, dto, admin.adminId);
  }
}
