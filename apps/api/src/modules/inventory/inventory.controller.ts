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
import { InventoryService } from './inventory.service';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
} from './dto/create-inventory.dto';
import {
  CreateInventoryCategoryDto,
  UpdateInventoryCategoryDto,
} from './dto/inventory-category.dto';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';
import {
  RequestInventoryTransferDto,
  CompleteInventoryTransferDto,
} from './dto/inventory-transfer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PermissionCode, TransferStatus } from '@washora/shared';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  private getTenantId(req: any): string {
    return req.user?.membership?.tenantId || req.user?.tenantId;
  }

  private getUserId(req: any): string {
    return req.user?._id || req.user?.id || req.user?.userId;
  }

  // ==========================================
  // CATEGORIES
  // ==========================================

  @Get('categories')
  @RequirePermissions(PermissionCode.INVENTORY_VIEW)
  @ApiOperation({ summary: 'List all inventory categories' })
  async findCategories(@Req() req: any) {
    const tenantId = this.getTenantId(req);
    return this.inventoryService.findCategories(tenantId);
  }

  @Post('categories')
  @RequirePermissions(PermissionCode.INVENTORY_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new inventory category' })
  async createCategory(
    @Req() req: any,
    @Body() dto: CreateInventoryCategoryDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.inventoryService.createCategory(tenantId, dto, userId);
  }

  @Put('categories/:id')
  @RequirePermissions(PermissionCode.INVENTORY_MANAGE)
  @ApiOperation({ summary: 'Update inventory category' })
  async updateCategory(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateInventoryCategoryDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.inventoryService.updateCategory(tenantId, id, dto, userId);
  }

  // ==========================================
  // STOCK MOVEMENTS & ADJUSTMENTS
  // ==========================================

  @Get('movements')
  @RequirePermissions(PermissionCode.INVENTORY_VIEW)
  @ApiOperation({ summary: 'List stock movements history' })
  @ApiQuery({ name: 'inventoryItemId', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findStockMovements(
    @Req() req: any,
    @Query('inventoryItemId') inventoryItemId?: string,
    @Query('branchId') branchId?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const tenantId = this.getTenantId(req);
    return this.inventoryService.findStockMovements(tenantId, {
      inventoryItemId,
      branchId,
      type,
      startDate,
      endDate,
      page,
      limit,
    });
  }

  @Post('adjustments')
  @RequirePermissions(PermissionCode.INVENTORY_ADJUST)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record manual stock adjustment or consumption' })
  async adjustStock(
    @Req() req: any,
    @Body() dto: StockAdjustmentDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.inventoryService.adjustStock(tenantId, dto, userId);
  }

  // ==========================================
  // TRANSFERS
  // ==========================================

  @Get('transfers')
  @RequirePermissions(PermissionCode.INVENTORY_VIEW)
  @ApiOperation({ summary: 'List inventory transfers between branches' })
  @ApiQuery({ name: 'fromBranchId', required: false })
  @ApiQuery({ name: 'toBranchId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: TransferStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findTransfers(
    @Req() req: any,
    @Query('fromBranchId') fromBranchId?: string,
    @Query('toBranchId') toBranchId?: string,
    @Query('status') status?: TransferStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const tenantId = this.getTenantId(req);
    return this.inventoryService.findTransfers(tenantId, {
      fromBranchId,
      toBranchId,
      status,
      page,
      limit,
    });
  }

  @Post('transfers')
  @RequirePermissions(PermissionCode.INVENTORY_TRANSFER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request new branch stock transfer' })
  async requestTransfer(
    @Req() req: any,
    @Body() dto: RequestInventoryTransferDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.inventoryService.requestTransfer(tenantId, dto, userId);
  }

  @Post('transfers/:id/complete')
  @RequirePermissions(PermissionCode.INVENTORY_TRANSFER)
  @ApiOperation({ summary: 'Complete/approve branch stock transfer' })
  async completeTransfer(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CompleteInventoryTransferDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.inventoryService.completeTransfer(tenantId, id, dto, userId);
  }

  @Post('transfers/:id/cancel')
  @RequirePermissions(PermissionCode.INVENTORY_TRANSFER)
  @ApiOperation({ summary: 'Cancel branch stock transfer' })
  async cancelTransfer(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.inventoryService.cancelTransfer(tenantId, id, userId);
  }

  // ==========================================
  // VALUATION
  // ==========================================

  @Get('valuation')
  @RequirePermissions(PermissionCode.INVENTORY_VIEW)
  @ApiOperation({ summary: 'Get current stock valuation summary' })
  @ApiQuery({ name: 'branchId', required: false })
  async getValuation(@Req() req: any, @Query('branchId') branchId?: string) {
    const tenantId = this.getTenantId(req);
    return this.inventoryService.getInventoryValuation(tenantId, branchId);
  }

  // ==========================================
  // INVENTORY ITEMS
  // ==========================================

  @Post('items')
  @RequirePermissions(PermissionCode.INVENTORY_CREATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new inventory item' })
  async createItem(
    @Req() req: any,
    @Body() dto: CreateInventoryItemDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.inventoryService.createItem(tenantId, dto, userId);
  }

  @Get('items')
  @RequirePermissions(PermissionCode.INVENTORY_VIEW)
  @ApiOperation({ summary: 'List inventory items with stock filters' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'lowStockOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findItems(
    @Req() req: any,
    @Query('branchId') branchId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('lowStockOnly') lowStockOnly?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const tenantId = this.getTenantId(req);
    return this.inventoryService.findItems(tenantId, {
      branchId,
      categoryId,
      search,
      lowStockOnly: lowStockOnly !== undefined ? lowStockOnly === 'true' : undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page,
      limit,
    });
  }

  @Get('items/:id')
  @RequirePermissions(PermissionCode.INVENTORY_VIEW)
  @ApiOperation({ summary: 'Get inventory item details by ID' })
  async findOneItem(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    return this.inventoryService.findOneItem(tenantId, id);
  }

  @Put('items/:id')
  @RequirePermissions(PermissionCode.INVENTORY_UPDATE)
  @ApiOperation({ summary: 'Update inventory item details' })
  async updateItem(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.inventoryService.updateItem(tenantId, id, dto, userId);
  }

  @Delete('items/:id')
  @RequirePermissions(PermissionCode.INVENTORY_DELETE)
  @ApiOperation({ summary: 'Delete inventory item (soft delete)' })
  async deleteItem(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.inventoryService.deleteItem(tenantId, id, userId);
  }
}
