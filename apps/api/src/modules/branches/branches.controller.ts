import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard, TenantGuard, BranchGuard, PermissionsGuard } from '../../common/guards';
import { RequirePermissions } from '../../common/decorators';
import { PermissionCode, RoleType } from '@washora/shared';

@ApiTags('Branches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, BranchGuard, PermissionsGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all branches accessible to the current user' })
  @RequirePermissions(PermissionCode.BRANCH_VIEW)
  async getBranches(@Req() req: any) {
    const isOwnerOrAdmin =
      req.user.role === RoleType.SHOP_OWNER || req.user.role === RoleType.SUPER_ADMIN;
    const assignedBranchIds = isOwnerOrAdmin ? [] : req.user.branchIds || [];
    return this.branchesService.findAll(req.tenantId, assignedBranchIds);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branch details by ID' })
  @RequirePermissions(PermissionCode.BRANCH_VIEW)
  async getBranchById(@Req() req: any, @Param('id') id: string) {
    return this.branchesService.findById(req.tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new branch' })
  @RequirePermissions(PermissionCode.BRANCH_CREATE)
  async createBranch(@Req() req: any, @Body() dto: CreateBranchDto) {
    return this.branchesService.create(req.tenantId, req.user.userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update branch information' })
  @RequirePermissions(PermissionCode.BRANCH_UPDATE)
  async updateBranch(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branchesService.update(req.tenantId, id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete / deactivate a branch' })
  @RequirePermissions(PermissionCode.BRANCH_DELETE)
  async deleteBranch(@Req() req: any, @Param('id') id: string) {
    return this.branchesService.delete(req.tenantId, id, req.user.userId);
  }
}
