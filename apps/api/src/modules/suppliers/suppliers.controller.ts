import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/create-supplier.dto';
import { RecordSupplierPaymentDto } from './dto/supplier-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PermissionCode } from '@washora/shared';

@ApiTags('Suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  private getTenantId(req: any): string {
    return req.user?.membership?.tenantId || req.user?.tenantId;
  }

  private getUserId(req: any): string {
    return req.user?._id || req.user?.id || req.user?.userId;
  }

  // ==========================================
  // SUPPLIER PAYMENTS (Must precede :id parameter)
  // ==========================================

  @Get('payments')
  @RequirePermissions(PermissionCode.SUPPLIER_VIEW)
  @ApiOperation({ summary: 'List supplier payments' })
  @ApiQuery({ name: 'supplierId', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findPayments(
    @Req() req: any,
    @Query('supplierId') supplierId?: string,
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const tenantId = this.getTenantId(req);
    return this.suppliersService.findPayments(tenantId, {
      supplierId,
      branchId,
      startDate,
      endDate,
      page,
      limit,
    });
  }

  @Post('payments')
  @RequirePermissions(PermissionCode.SUPPLIER_PAYMENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record payment to a supplier' })
  async recordPayment(
    @Req() req: any,
    @Body() dto: RecordSupplierPaymentDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.suppliersService.recordPayment(tenantId, dto, userId);
  }

  // ==========================================
  // SUPPLIERS CRUD
  // ==========================================

  @Post()
  @RequirePermissions(PermissionCode.SUPPLIER_CREATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new supplier' })
  async create(
    @Req() req: any,
    @Body() dto: CreateSupplierDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.suppliersService.create(tenantId, dto, userId);
  }

  @Get()
  @RequirePermissions(PermissionCode.SUPPLIER_VIEW)
  @ApiOperation({ summary: 'List suppliers with pagination and filtering' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const tenantId = this.getTenantId(req);
    return this.suppliersService.findAll(tenantId, {
      search,
      category,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page,
      limit,
    });
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.SUPPLIER_VIEW)
  @ApiOperation({ summary: 'Get supplier details by ID' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    return this.suppliersService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequirePermissions(PermissionCode.SUPPLIER_UPDATE)
  @ApiOperation({ summary: 'Update supplier details' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.suppliersService.update(tenantId, id, dto, userId);
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.SUPPLIER_DELETE)
  @ApiOperation({ summary: 'Delete supplier (soft delete)' })
  async remove(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.suppliersService.remove(tenantId, id, userId);
  }

  @Get(':id/ledger')
  @RequirePermissions(PermissionCode.SUPPLIER_VIEW)
  @ApiOperation({ summary: 'Get supplier transaction ledger' })
  async getLedger(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    return this.suppliersService.getLedger(tenantId, id);
  }

  @Post(':id/recalculate-balance')
  @RequirePermissions(PermissionCode.SUPPLIER_UPDATE)
  @ApiOperation({ summary: 'Recalculate supplier balance from all purchases and payments' })
  async recalculateBalance(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    const currentBalance = await this.suppliersService.recalculateBalance(tenantId, id);
    return { success: true, currentBalance };
  }
}
