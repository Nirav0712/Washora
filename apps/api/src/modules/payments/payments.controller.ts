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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { JwtAuthGuard, TenantGuard, PermissionsGuard } from '../../common/guards';
import { RequirePermissions } from '../../common/decorators';
import { PermissionCode, RoleType } from '@washora/shared';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('payments')
  @ApiOperation({ summary: 'Get paginated payment transaction history' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'method', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'orderId', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @RequirePermissions(PermissionCode.PAYMENT_VIEW)
  async getPayments(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('method') method?: string,
    @Query('status') status?: string,
    @Query('branchId') branchId?: string,
    @Query('customerId') customerId?: string,
    @Query('orderId') orderId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const userRole = req.membership?.roleType;
    const isOwner = userRole === RoleType.SUPER_ADMIN || userRole === RoleType.SHOP_OWNER;
    const userBranchIds = isOwner ? [] : (req.membership?.branchIds || []);

    return this.paymentsService.findAll(
      req.tenantId,
      {
        page,
        limit,
        search,
        method,
        status,
        branchId,
        customerId,
        orderId,
        dateFrom,
        dateTo,
      },
      userBranchIds,
    );
  }

  @Get('payments/:id')
  @ApiOperation({ summary: 'Get payment record details by ID' })
  @RequirePermissions(PermissionCode.PAYMENT_VIEW)
  async getPaymentById(@Req() req: any, @Param('id') id: string) {
    return this.paymentsService.findById(req.tenantId, id);
  }

  @Get('orders/:orderId/payments')
  @ApiOperation({ summary: 'Get all payment records for an order' })
  @RequirePermissions(PermissionCode.PAYMENT_VIEW)
  async getPaymentsByOrder(@Req() req: any, @Param('orderId') orderId: string) {
    return this.paymentsService.findByOrderId(req.tenantId, orderId);
  }

  @Post('payments')
  @ApiOperation({ summary: 'Record payment against an order' })
  @RequirePermissions(PermissionCode.PAYMENT_CREATE)
  async createPayment(@Req() req: any, @Body() dto: CreatePaymentDto) {
    const actorName = req.user?.name || req.user?.email || 'Staff';
    return this.paymentsService.create(req.tenantId, req.user.userId, actorName, dto);
  }

  @Post('payments/:id/refund')
  @ApiOperation({ summary: 'Process full or partial refund for a payment' })
  @RequirePermissions(PermissionCode.PAYMENT_REFUND)
  async refundPayment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: RefundPaymentDto,
  ) {
    const actorName = req.user?.name || req.user?.email || 'Staff';
    return this.paymentsService.refund(req.tenantId, id, req.user.userId, actorName, dto);
  }
}
