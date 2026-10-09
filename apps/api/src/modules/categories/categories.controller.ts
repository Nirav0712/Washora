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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard, TenantGuard, PermissionsGuard } from '../../common/guards';
import { RequirePermissions } from '../../common/decorators';
import { PermissionCode } from '@washora/shared';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated list of categories with optional search and branch filter' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  @RequirePermissions(PermissionCode.CATEGORY_VIEW)
  async getCategories(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('branchId') branchId?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.categoriesService.findAll(req.tenantId, {
      page,
      limit,
      search,
      branchId,
      isActive,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category details by ID' })
  @RequirePermissions(PermissionCode.CATEGORY_VIEW)
  async getCategoryById(@Req() req: any, @Param('id') id: string) {
    return this.categoriesService.findById(req.tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new dynamic category' })
  @RequirePermissions(PermissionCode.CATEGORY_CREATE)
  async createCategory(@Req() req: any, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(req.tenantId, req.user.userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update category details' })
  @RequirePermissions(PermissionCode.CATEGORY_UPDATE)
  async updateCategory(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(req.tenantId, id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Safe delete / archive a category' })
  @RequirePermissions(PermissionCode.CATEGORY_DELETE)
  async deleteCategory(@Req() req: any, @Param('id') id: string) {
    return this.categoriesService.delete(req.tenantId, id, req.user.userId);
  }
}
