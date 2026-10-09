import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PayPurchaseDto } from './dto/purchase-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PermissionCode, PurchaseStatus, PurchasePaymentStatus } from '@washora/shared';

@ApiTags('Purchases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  private getTenantId(req: any): string {
    return req.user?.membership?.tenantId || req.user?.tenantId;
  }

  private getUserId(req: any): string {
    return req.user?._id || req.user?.id || req.user?.userId;
  }

  @Post()
  @RequirePermissions(PermissionCode.PURCHASE_CREATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new purchase order' })
  async create(
    @Req() req: any,
    @Body() dto: CreatePurchaseDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.purchasesService.create(tenantId, dto, userId);
  }

  @Get()
  @RequirePermissions(PermissionCode.PURCHASE_VIEW)
  @ApiOperation({ summary: 'List purchase orders with pagination and filtering' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'supplierId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: PurchaseStatus })
  @ApiQuery({ name: 'paymentStatus', required: false, enum: PurchasePaymentStatus })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Req() req: any,
    @Query('branchId') branchId?: string,
    @Query('supplierId') supplierId?: string,
    @Query('status') status?: PurchaseStatus,
    @Query('paymentStatus') paymentStatus?: PurchasePaymentStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const tenantId = this.getTenantId(req);
    return this.purchasesService.findAll(tenantId, {
      branchId,
      supplierId,
      status,
      paymentStatus,
      startDate,
      endDate,
      search,
      page,
      limit,
    });
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.PURCHASE_VIEW)
  @ApiOperation({ summary: 'Get purchase order details by ID' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    return this.purchasesService.findOne(tenantId, id);
  }

  @Post(':id/receive')
  @RequirePermissions(PermissionCode.PURCHASE_UPDATE)
  @ApiOperation({ summary: 'Mark purchase order as received and update stock' })
  async receive(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.purchasesService.receive(tenantId, id, userId);
  }

  @Post(':id/cancel')
  @RequirePermissions(PermissionCode.PURCHASE_UPDATE)
  @ApiOperation({ summary: 'Cancel purchase order' })
  async cancel(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.purchasesService.cancel(tenantId, id, userId);
  }

  @Post(':id/pay')
  @RequirePermissions(PermissionCode.PURCHASE_PAY)
  @ApiOperation({ summary: 'Record payment against purchase order' })
  async pay(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: PayPurchaseDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.purchasesService.pay(tenantId, id, dto, userId);
  }
}
