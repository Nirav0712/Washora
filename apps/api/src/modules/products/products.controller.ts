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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductPricingDto, UpdateBranchPriceOverridesDto } from './dto/pricing.dto';
import { JwtAuthGuard, TenantGuard, PermissionsGuard } from '../../common/guards';
import { RequirePermissions } from '../../common/decorators';
import { PermissionCode } from '@washora/shared';

@ApiTags('Products & Pricing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated products with branch pricing and category filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'serviceId', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  @RequirePermissions(PermissionCode.PRODUCT_VIEW)
  async getProducts(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('branchId') branchId?: string,
    @Query('serviceId') serviceId?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.productsService.findAll(req.tenantId, {
      page,
      limit,
      search,
      categoryId,
      branchId,
      serviceId,
      isActive,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product details by ID with optional branch pricing' })
  @ApiQuery({ name: 'branchId', required: false })
  @RequirePermissions(PermissionCode.PRODUCT_VIEW)
  async getProductById(
    @Req() req: any,
    @Param('id') id: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.productsService.findById(req.tenantId, id, branchId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product with tiered pricing' })
  @RequirePermissions(PermissionCode.PRODUCT_CREATE)
  async createProduct(@Req() req: any, @Body() dto: CreateProductDto) {
    return this.productsService.create(req.tenantId, req.user.userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product properties' })
  @RequirePermissions(PermissionCode.PRODUCT_UPDATE)
  async updateProduct(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(req.tenantId, id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete / deactivate a product' })
  @RequirePermissions(PermissionCode.PRODUCT_DELETE)
  async deleteProduct(@Req() req: any, @Param('id') id: string) {
    return this.productsService.delete(req.tenantId, id, req.user.userId);
  }

  @Get(':id/pricing')
  @ApiOperation({ summary: 'Get standard product pricing tiers' })
  @RequirePermissions(PermissionCode.PRICING_VIEW)
  async getPricing(@Req() req: any, @Param('id') id: string) {
    const product = await this.productsService.findById(req.tenantId, id);
    return product.prices;
  }

  @Patch(':id/pricing')
  @ApiOperation({ summary: 'Update standard product pricing tiers' })
  @RequirePermissions(PermissionCode.PRICING_UPDATE)
  async updatePricing(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProductPricingDto,
  ) {
    return this.productsService.updatePricing(req.tenantId, id, req.user.userId, dto.prices);
  }

  @Get(':id/branch-prices')
  @ApiOperation({ summary: 'Get branch specific price overrides for a product' })
  @RequirePermissions(PermissionCode.PRICING_VIEW)
  async getBranchPrices(@Req() req: any, @Param('id') id: string) {
    const product = await this.productsService.findById(req.tenantId, id);
    return product.branchPriceOverrides || [];
  }

  @Patch(':id/branch-prices')
  @ApiOperation({ summary: 'Update branch price overrides' })
  @RequirePermissions(PermissionCode.PRICING_UPDATE)
  async updateBranchPrices(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateBranchPriceOverridesDto,
  ) {
    return this.productsService.updateBranchPriceOverrides(
      req.tenantId,
      id,
      req.user.userId,
      dto.branchPriceOverrides,
    );
  }
}
