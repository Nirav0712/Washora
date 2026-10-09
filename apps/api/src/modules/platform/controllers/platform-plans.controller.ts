import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SubscriptionPlanService } from '../services/subscription-plan.service';
import { PlatformAuthGuard } from '../guards/platform-auth.guard';
import { PlatformPermissionsGuard } from '../guards/platform-permissions.guard';
import { CurrentAdmin, CurrentAdminContext } from '../decorators/current-admin.decorator';
import { RequirePlatformPermission } from '../decorators/require-permission.decorator';
import { PlatformPermission } from '@washora/shared';
import { CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto } from '../dto/subscription-plan.dto';

@ApiTags('Platform Subscription Plans')
@Controller('platform/plans')
export class PlatformPlansController {
  constructor(private planService: SubscriptionPlanService) {}

  @Get()
  @ApiOperation({ summary: 'List all subscription plans (public or administrative view)' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'isPublic', required: false, type: Boolean })
  async listPlans(
    @Query('isActive') isActive?: boolean,
    @Query('isPublic') isPublic?: boolean,
  ) {
    return this.planService.listPlans({ isActive, isPublic });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription plan details by ID' })
  async getPlanById(@Param('id') id: string) {
    return this.planService.getPlanById(id);
  }

  @Post()
  @UseGuards(PlatformAuthGuard, PlatformPermissionsGuard)
  @RequirePlatformPermission(PlatformPermission.PLANS_CREATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new subscription plan tier' })
  async createPlan(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Body() dto: CreateSubscriptionPlanDto,
  ) {
    return this.planService.createPlan(dto, admin.adminId);
  }

  @Patch(':id')
  @UseGuards(PlatformAuthGuard, PlatformPermissionsGuard)
  @RequirePlatformPermission(PlatformPermission.PLANS_UPDATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update subscription plan metadata, features, or limits' })
  async updatePlan(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionPlanDto,
  ) {
    return this.planService.updatePlan(id, dto, admin.adminId);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @UseGuards(PlatformAuthGuard, PlatformPermissionsGuard)
  @RequirePlatformPermission(PlatformPermission.PLANS_ARCHIVE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive a subscription plan tier' })
  async archivePlan(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Param('id') id: string,
  ) {
    return this.planService.archivePlan(id, admin.adminId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(PlatformAuthGuard, PlatformPermissionsGuard)
  @RequirePlatformPermission(PlatformPermission.PLANS_ARCHIVE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a plan tier (only if unreferenced by subscriptions)' })
  async deletePlan(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Param('id') id: string,
  ) {
    return this.planService.deletePlan(id, admin.adminId);
  }
}
