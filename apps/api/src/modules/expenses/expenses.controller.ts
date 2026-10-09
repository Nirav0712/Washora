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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PermissionCode, RoleType } from '@washora/shared';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto, RejectExpenseDto, PayExpenseDto } from './dto/create-expense.dto';
import { CreateExpenseCategoryDto, UpdateExpenseCategoryDto } from './dto/expense-category.dto';

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  private getTenantId(req: any): string {
    return req.user?.membership?.tenantId || req.user?.tenantId;
  }

  private getUserId(req: any): string {
    return req.user?._id || req.user?.id || req.user?.userId;
  }

  private getUserBranchIds(req: any): string[] {
    const roleCode = req.user?.role?.code || req.user?.roleCode || req.user?.role;
    if (roleCode === RoleType.SUPER_ADMIN || roleCode === RoleType.SHOP_OWNER) {
      return [];
    }
    return req.user?.branchIds || req.user?.membership?.branchIds || [];
  }

  // ==========================================
  // EXPENSE CATEGORIES
  // ==========================================

  @Get('categories')
  @RequirePermissions(PermissionCode.EXPENSE_VIEW)
  @ApiOperation({ summary: 'Get all active expense categories for tenant' })
  async getCategories(@Req() req: any) {
    const tenantId = this.getTenantId(req);
    return this.expensesService.getCategories(tenantId);
  }

  @Post('categories')
  @RequirePermissions(PermissionCode.EXPENSE_CATEGORY_MANAGE)
  @ApiOperation({ summary: 'Create custom expense category' })
  async createCategory(@Req() req: any, @Body() dto: CreateExpenseCategoryDto) {
    const tenantId = this.getTenantId(req);
    return this.expensesService.createCategory(tenantId, dto);
  }

  @Patch('categories/:id')
  @RequirePermissions(PermissionCode.EXPENSE_CATEGORY_MANAGE)
  @ApiOperation({ summary: 'Update expense category' })
  async updateCategory(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateExpenseCategoryDto) {
    const tenantId = this.getTenantId(req);
    return this.expensesService.updateCategory(tenantId, id, dto);
  }

  // ==========================================
  // EXPENSES
  // ==========================================

  @Post()
  @RequirePermissions(PermissionCode.EXPENSE_CREATE)
  @ApiOperation({ summary: 'Create an expense record' })
  async createExpense(@Req() req: any, @Body() dto: CreateExpenseDto) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.expensesService.create(tenantId, dto, userId);
  }

  @Get()
  @RequirePermissions(PermissionCode.EXPENSE_VIEW)
  @ApiOperation({ summary: 'List expenses with pagination & filters' })
  async getExpenses(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('branchId') branchId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('supplierId') supplierId?: string,
    @Query('status') status?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const tenantId = this.getTenantId(req);
    const userBranchIds = this.getUserBranchIds(req);
    return this.expensesService.findAll(
      tenantId,
      { page, limit, search, branchId, categoryId, supplierId, status, paymentMethod, dateFrom, dateTo },
      userBranchIds,
    );
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.EXPENSE_VIEW)
  @ApiOperation({ summary: 'Get expense by ID' })
  async getExpenseById(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    return this.expensesService.findById(tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.EXPENSE_UPDATE)
  @ApiOperation({ summary: 'Update expense record' })
  async updateExpense(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.expensesService.update(tenantId, id, dto, userId);
  }

  @Post(':id/approve')
  @RequirePermissions(PermissionCode.EXPENSE_APPROVE)
  @ApiOperation({ summary: 'Approve expense' })
  async approveExpense(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.expensesService.approve(tenantId, id, userId);
  }

  @Post(':id/reject')
  @RequirePermissions(PermissionCode.EXPENSE_APPROVE)
  @ApiOperation({ summary: 'Reject expense' })
  async rejectExpense(@Req() req: any, @Param('id') id: string, @Body() dto: RejectExpenseDto) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.expensesService.reject(tenantId, id, dto, userId);
  }

  @Post(':id/pay')
  @RequirePermissions(PermissionCode.EXPENSE_PAY)
  @ApiOperation({ summary: 'Record payment for expense' })
  async payExpense(@Req() req: any, @Param('id') id: string, @Body() dto: PayExpenseDto) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.expensesService.pay(tenantId, id, dto, userId);
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.EXPENSE_DELETE)
  @ApiOperation({ summary: 'Cancel expense' })
  async deleteExpense(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.expensesService.delete(tenantId, id, userId);
  }
}
