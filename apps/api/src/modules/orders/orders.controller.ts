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
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto, UpdateOrderStatusDto, CancelOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard, TenantGuard, PermissionsGuard } from '../../common/guards';
import { RequirePermissions } from '../../common/decorators';
import { PermissionCode, RoleType } from '@washora/shared';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated orders with filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'orderNumber', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'phone', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'paymentStatus', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'pricingTier', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @RequirePermissions(PermissionCode.ORDER_VIEW)
  async getOrders(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('orderNumber') orderNumber?: string,
    @Query('customerId') customerId?: string,
    @Query('phone') phone?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('branchId') branchId?: string,
    @Query('pricingTier') pricingTier?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    // If not super admin or shop owner, scope to user's assigned branches
    const userRole = req.membership?.roleType;
    const isOwner = userRole === RoleType.SUPER_ADMIN || userRole === RoleType.SHOP_OWNER;
    const userBranchIds = isOwner ? [] : (req.membership?.branchIds || []);

    return this.ordersService.findAll(
      req.tenantId,
      {
        page,
        limit,
        search,
        orderNumber,
        customerId,
        phone,
        status,
        paymentStatus,
        branchId,
        pricingTier,
        dateFrom,
        dateTo,
      },
      userBranchIds,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details by ID' })
  @RequirePermissions(PermissionCode.ORDER_VIEW)
  async getOrderById(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.findById(req.tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new production order from POS' })
  @RequirePermissions(PermissionCode.ORDER_CREATE)
  async createOrder(@Req() req: any, @Body() dto: CreateOrderDto) {
    const actorName = req.user?.name || req.user?.email || 'Staff';
    return this.ordersService.create(req.tenantId, req.user.userId, actorName, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order metadata/notes' })
  @RequirePermissions(PermissionCode.ORDER_UPDATE)
  async updateOrder(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.ordersService.update(req.tenantId, id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete an order' })
  @RequirePermissions(PermissionCode.ORDER_DELETE)
  async deleteOrder(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.delete(req.tenantId, id, req.user.userId);
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Advance order status in workflow' })
  @RequirePermissions(PermissionCode.ORDER_STATUS_UPDATE)
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const actorName = req.user?.name || req.user?.email || 'Staff';
    return this.ordersService.updateStatus(req.tenantId, id, req.user.userId, actorName, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an active order' })
  @RequirePermissions(PermissionCode.ORDER_CANCEL)
  async cancelOrder(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
  ) {
    const actorName = req.user?.name || req.user?.email || 'Staff';
    return this.ordersService.cancelOrder(req.tenantId, id, req.user.userId, actorName, dto.reason);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get order history timeline' })
  @RequirePermissions(PermissionCode.ORDER_VIEW)
  async getTimeline(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.getTimeline(req.tenantId, id);
  }

  @Get(':id/invoice')
  @ApiOperation({ summary: 'Get structured invoice data for printing or display' })
  @RequirePermissions(PermissionCode.ORDER_VIEW)
  async getInvoice(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.getInvoiceData(req.tenantId, id);
  }
}
