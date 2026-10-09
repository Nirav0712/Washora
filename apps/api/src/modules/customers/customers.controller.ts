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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, CustomerAddressDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard, TenantGuard, PermissionsGuard } from '../../common/guards';
import { RequirePermissions } from '../../common/decorators';
import { PermissionCode } from '@washora/shared';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated list of customers with search and filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'phone', required: false })
  @ApiQuery({ name: 'name', required: false })
  @ApiQuery({ name: 'isVip', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  @RequirePermissions(PermissionCode.CUSTOMER_VIEW)
  async getCustomers(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('phone') phone?: string,
    @Query('name') name?: string,
    @Query('isVip') isVip?: boolean,
    @Query('branchId') branchId?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.customersService.findAll(req.tenantId, {
      page,
      limit,
      search,
      phone,
      name,
      isVip,
      branchId,
      isActive,
    });
  }

  @Get('search')
  @ApiOperation({ summary: 'Quick lookup customers by name, phone or code' })
  @ApiQuery({ name: 'q', required: true })
  @RequirePermissions(PermissionCode.CUSTOMER_VIEW)
  async searchCustomers(@Req() req: any, @Query('q') query: string) {
    return this.customersService.search(req.tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer profile by ID' })
  @RequirePermissions(PermissionCode.CUSTOMER_VIEW)
  async getCustomerById(@Req() req: any, @Param('id') id: string) {
    return this.customersService.findById(req.tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @RequirePermissions(PermissionCode.CUSTOMER_CREATE)
  async createCustomer(@Req() req: any, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(req.tenantId, req.user.userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer profile' })
  @RequirePermissions(PermissionCode.CUSTOMER_UPDATE)
  async updateCustomer(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(req.tenantId, id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete customer' })
  @RequirePermissions(PermissionCode.CUSTOMER_DELETE)
  async deleteCustomer(@Req() req: any, @Param('id') id: string) {
    return this.customersService.delete(req.tenantId, id, req.user.userId);
  }

  @Get(':id/orders')
  @ApiOperation({ summary: 'Get order history for customer' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @RequirePermissions(PermissionCode.CUSTOMER_VIEW)
  async getCustomerOrders(
    @Req() req: any,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.customersService.getCustomerOrders(req.tenantId, id, { page, limit });
  }

  @Get(':id/balance')
  @ApiOperation({ summary: 'Get customer outstanding balance and financial summary' })
  @RequirePermissions(PermissionCode.CUSTOMER_VIEW)
  async getCustomerBalance(@Req() req: any, @Param('id') id: string) {
    return this.customersService.getCustomerBalance(req.tenantId, id);
  }

  // ==========================================
  // CUSTOMER ADDRESSES
  // ==========================================

  @Get(':id/addresses')
  @ApiOperation({ summary: 'Get list of addresses for a customer' })
  @RequirePermissions(PermissionCode.CUSTOMER_VIEW)
  async getCustomerAddresses(@Req() req: any, @Param('id') id: string) {
    return this.customersService.getAddresses(req.tenantId, id);
  }

  @Post(':id/addresses')
  @ApiOperation({ summary: 'Add new address to customer profile' })
  @RequirePermissions(PermissionCode.CUSTOMER_UPDATE)
  async addCustomerAddress(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CustomerAddressDto,
  ) {
    return this.customersService.addAddress(req.tenantId, id, req.user.userId, dto);
  }

  @Patch(':id/addresses/:addressId')
  @ApiOperation({ summary: 'Update customer address' })
  @RequirePermissions(PermissionCode.CUSTOMER_UPDATE)
  async updateCustomerAddress(
    @Req() req: any,
    @Param('id') id: string,
    @Param('addressId') addressId: string,
    @Body() dto: CustomerAddressDto,
  ) {
    return this.customersService.updateAddress(req.tenantId, id, addressId, req.user.userId, dto);
  }

  @Delete(':id/addresses/:addressId')
  @ApiOperation({ summary: 'Delete customer address' })
  @RequirePermissions(PermissionCode.CUSTOMER_UPDATE)
  async deleteCustomerAddress(
    @Req() req: any,
    @Param('id') id: string,
    @Param('addressId') addressId: string,
  ) {
    return this.customersService.deleteAddress(req.tenantId, id, addressId, req.user.userId);
  }

  @Post(':id/addresses/:addressId/default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set address as default for customer' })
  @RequirePermissions(PermissionCode.CUSTOMER_UPDATE)
  async setDefaultCustomerAddress(
    @Req() req: any,
    @Param('id') id: string,
    @Param('addressId') addressId: string,
  ) {
    return this.customersService.setDefaultAddress(req.tenantId, id, addressId, req.user.userId);
  }

  // ==========================================
  // CRM 360 & NOTES
  // ==========================================

  @Get(':id/overview')
  @ApiOperation({ summary: 'Get Customer 360 Overview with KPIs and operational summaries' })
  @RequirePermissions(PermissionCode.CUSTOMER_VIEW)
  async getCustomerOverview(@Req() req: any, @Param('id') id: string) {
    return this.customersService.getOverview(req.tenantId, id);
  }

  @Get(':id/notes')
  @ApiOperation({ summary: 'Get internal staff notes for customer' })
  @RequirePermissions(PermissionCode.CUSTOMER_NOTES)
  async getCustomerNotes(@Req() req: any, @Param('id') id: string) {
    return this.customersService.getNotes(req.tenantId, id);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Create internal staff note for customer' })
  @RequirePermissions(PermissionCode.CUSTOMER_NOTES)
  async addCustomerNote(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { content: string; authorName?: string },
  ) {
    const authorName = body.authorName || req.user.name || 'Staff';
    return this.customersService.addNote(req.tenantId, id, req.user.userId, {
      content: body.content,
      authorName,
    });
  }

  @Patch(':id/notes/:noteId')
  @ApiOperation({ summary: 'Update internal staff note' })
  @RequirePermissions(PermissionCode.CUSTOMER_NOTES)
  async updateCustomerNote(
    @Req() req: any,
    @Param('id') id: string,
    @Param('noteId') noteId: string,
    @Body() body: { content: string },
  ) {
    return this.customersService.updateNote(req.tenantId, id, noteId, req.user.userId, body);
  }

  @Delete(':id/notes/:noteId')
  @ApiOperation({ summary: 'Delete internal staff note' })
  @RequirePermissions(PermissionCode.CUSTOMER_NOTES)
  async deleteCustomerNote(
    @Req() req: any,
    @Param('id') id: string,
    @Param('noteId') noteId: string,
  ) {
    return this.customersService.deleteNote(req.tenantId, id, noteId, req.user.userId);
  }

  @Get(':id/payments')
  @ApiOperation({ summary: 'Get customer payment transactions' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @RequirePermissions(PermissionCode.CUSTOMER_VIEW)
  async getCustomerPayments(
    @Req() req: any,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.customersService.getCustomerPayments(req.tenantId, id, { page, limit });
  }

  @Get(':id/invoices')
  @ApiOperation({ summary: 'Get customer invoice list' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @RequirePermissions(PermissionCode.CUSTOMER_VIEW)
  async getCustomerInvoices(
    @Req() req: any,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.customersService.getCustomerInvoices(req.tenantId, id, { page, limit });
  }

  @Get(':id/pickups')
  @ApiOperation({ summary: 'Get customer pickup request history' })
  @RequirePermissions(PermissionCode.CUSTOMER_VIEW)
  async getCustomerPickups(@Req() req: any, @Param('id') id: string) {
    return this.customersService.getCustomerPickups(req.tenantId, id);
  }

  @Get(':id/deliveries')
  @ApiOperation({ summary: 'Get customer delivery request history' })
  @RequirePermissions(PermissionCode.CUSTOMER_VIEW)
  async getCustomerDeliveries(@Req() req: any, @Param('id') id: string) {
    return this.customersService.getCustomerDeliveries(req.tenantId, id);
  }

  @Get(':id/notifications')
  @ApiOperation({ summary: 'Get customer communication and notification logs' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @RequirePermissions(PermissionCode.CUSTOMER_VIEW)
  async getCustomerNotifications(
    @Req() req: any,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.customersService.getCustomerNotifications(req.tenantId, id, { page, limit });
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Get aggregated 360 Activity Timeline for customer' })
  @RequirePermissions(PermissionCode.CUSTOMER_VIEW)
  async getCustomerActivity(@Req() req: any, @Param('id') id: string) {
    return this.customersService.getActivityTimeline(req.tenantId, id);
  }
}
