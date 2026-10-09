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
import { CustomerPortalService } from './customer-portal.service';
import { CustomerAuthGuard } from './guards/customer-auth.guard';
import { CurrentCustomer, CurrentCustomerContext } from './decorators/current-customer.decorator';
import { UpdateProfileDto, CustomerAddressDto, UpdateCustomerAddressDto } from './dto/customer-auth.dto';
import { UpdatePreferencesDto } from '../notifications/notification-preference.service';

@ApiTags('Customer Portal')
@Controller('customer-portal')
@UseGuards(CustomerAuthGuard)
@ApiBearerAuth()
export class CustomerPortalController {
  constructor(private readonly portalService: CustomerPortalService) {}

  // ==========================================
  // DASHBOARD & PROFILE
  // ==========================================

  @Get('dashboard')
  @ApiOperation({ summary: 'Customer personal overview dashboard with active orders and dues' })
  async getDashboard(@CurrentCustomer() customer: CurrentCustomerContext) {
    return this.portalService.getDashboard(customer.tenantId, customer.customerId);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get customer personal profile details' })
  async getProfile(@CurrentCustomer() customer: CurrentCustomerContext) {
    return this.portalService.getProfile(customer.tenantId, customer.customerId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update customer personal profile name or email' })
  async updateProfile(
    @CurrentCustomer() customer: CurrentCustomerContext,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.portalService.updateProfile(customer.tenantId, customer.customerId, dto);
  }

  // ==========================================
  // ADDRESSES
  // ==========================================

  @Get('addresses')
  @ApiOperation({ summary: 'List customer saved pickup/delivery addresses' })
  async getAddresses(@CurrentCustomer() customer: CurrentCustomerContext) {
    return this.portalService.getAddresses(customer.tenantId, customer.customerId);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Add a new saved address' })
  async addAddress(
    @CurrentCustomer() customer: CurrentCustomerContext,
    @Body() dto: CustomerAddressDto,
  ) {
    return this.portalService.addAddress(customer.tenantId, customer.customerId, dto);
  }

  @Patch('addresses/:id')
  @ApiOperation({ summary: 'Update a saved address' })
  async updateAddress(
    @CurrentCustomer() customer: CurrentCustomerContext,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerAddressDto,
  ) {
    return this.portalService.updateAddress(customer.tenantId, customer.customerId, id, dto);
  }

  @Delete('addresses/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a saved address' })
  async deleteAddress(
    @CurrentCustomer() customer: CurrentCustomerContext,
    @Param('id') id: string,
  ) {
    return this.portalService.deleteAddress(customer.tenantId, customer.customerId, id);
  }

  @Post('addresses/:id/default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set default address' })
  async setDefaultAddress(
    @CurrentCustomer() customer: CurrentCustomerContext,
    @Param('id') id: string,
  ) {
    return this.portalService.setDefaultAddress(customer.tenantId, customer.customerId, id);
  }

  // ==========================================
  // ORDERS
  // ==========================================

  @Get('orders')
  @ApiOperation({ summary: 'List customer personal laundry orders with filters & pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false })
  async getOrders(
    @CurrentCustomer() customer: CurrentCustomerContext,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.portalService.getOrders(customer.tenantId, customer.customerId, { page, limit, status });
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get customer order tracking details and garment breakdown' })
  async getOrderById(
    @CurrentCustomer() customer: CurrentCustomerContext,
    @Param('id') id: string,
  ) {
    return this.portalService.getOrderById(customer.tenantId, customer.customerId, id);
  }

  // ==========================================
  // PAYMENTS & INVOICES
  // ==========================================

  @Get('payments')
  @ApiOperation({ summary: 'List customer payment transaction history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPayments(
    @CurrentCustomer() customer: CurrentCustomerContext,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.portalService.getPayments(customer.tenantId, customer.customerId, { page, limit });
  }

  @Get('invoices')
  @ApiOperation({ summary: 'List customer order invoices' })
  async getInvoices(@CurrentCustomer() customer: CurrentCustomerContext) {
    return this.portalService.getInvoices(customer.tenantId, customer.customerId);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get customer invoice details' })
  async getInvoiceById(
    @CurrentCustomer() customer: CurrentCustomerContext,
    @Param('id') id: string,
  ) {
    return this.portalService.getInvoiceById(customer.tenantId, customer.customerId, id);
  }

  // ==========================================
  // NOTIFICATIONS & PREFERENCES
  // ==========================================

  @Get('notifications')
  @ApiOperation({ summary: 'List customer notification communication history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getNotifications(
    @CurrentCustomer() customer: CurrentCustomerContext,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.portalService.getNotifications(customer.tenantId, customer.customerId, { page, limit });
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get customer notification channel preferences' })
  async getPreferences(@CurrentCustomer() customer: CurrentCustomerContext) {
    return this.portalService.getPreferences(customer.tenantId, customer.customerId);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update customer notification channel preferences' })
  async updatePreferences(
    @CurrentCustomer() customer: CurrentCustomerContext,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.portalService.updatePreferences(customer.tenantId, customer.customerId, dto);
  }
}
