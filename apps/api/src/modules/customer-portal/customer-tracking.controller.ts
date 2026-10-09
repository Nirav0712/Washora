import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerTrackingService } from './customer-tracking.service';
import { JwtAuthGuard, TenantGuard, PermissionsGuard } from '../../common/guards';
import { RequirePermissions } from '../../common/decorators';
import { PermissionCode } from '@washora/shared';

@ApiTags('Customer Tracking')
@Controller('customer-tracking')
export class CustomerTrackingController {
  constructor(private readonly trackingService: CustomerTrackingService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Public lightweight order tracking by cryptographically secure token' })
  async getTrackingByToken(@Param('token') token: string) {
    return this.trackingService.getTrackingByToken(token);
  }

  @Post(':orderId/regenerate')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermissions(PermissionCode.ORDER_VIEW)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate secure tracking link token for an order' })
  async regenerateToken(@Req() req: any, @Param('orderId') orderId: string) {
    const tenantId = req.tenantId || req.user?.membership?.tenantId || req.user?.tenantId;
    return this.trackingService.regenerateToken(tenantId, orderId);
  }

  @Post(':orderId/revoke')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermissions(PermissionCode.ORDER_VIEW)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke tracking token for an order' })
  async revokeToken(@Req() req: any, @Param('orderId') orderId: string) {
    const tenantId = req.tenantId || req.user?.membership?.tenantId || req.user?.tenantId;
    return this.trackingService.revokeToken(tenantId, orderId);
  }
}
