import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GarmentsService } from './garments.service';
import { CreateGarmentDto } from './dto/create-garment.dto';
import { UpdateGarmentDto } from './dto/update-garment.dto';
import { JwtAuthGuard, TenantGuard, PermissionsGuard } from '../../common/guards';
import { RequirePermissions } from '../../common/decorators';
import { PermissionCode } from '@washora/shared';

@ApiTags('Garments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller()
export class GarmentsController {
  constructor(private readonly garmentsService: GarmentsService) {}

  @Get('garments/:id')
  @ApiOperation({ summary: 'Get garment item by ID' })
  @RequirePermissions(PermissionCode.GARMENT_VIEW)
  async getGarmentById(@Req() req: any, @Param('id') id: string) {
    return this.garmentsService.findById(req.tenantId, id);
  }

  @Get('orders/:orderId/garments')
  @ApiOperation({ summary: 'Get all garments belonging to an order' })
  @RequirePermissions(PermissionCode.GARMENT_VIEW)
  async getGarmentsByOrder(@Req() req: any, @Param('orderId') orderId: string) {
    return this.garmentsService.findByOrderId(req.tenantId, orderId);
  }

  @Post('orders/:orderId/garments')
  @ApiOperation({ summary: 'Add a garment to an existing order' })
  @RequirePermissions(PermissionCode.GARMENT_CREATE)
  async addGarmentToOrder(
    @Req() req: any,
    @Param('orderId') orderId: string,
    @Body() dto: CreateGarmentDto,
  ) {
    return this.garmentsService.createForOrder(req.tenantId, orderId, req.user.userId, dto);
  }

  @Patch('garments/:id')
  @ApiOperation({ summary: 'Update garment status, defect notes, or shelf location' })
  @RequirePermissions(PermissionCode.GARMENT_UPDATE)
  async updateGarment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateGarmentDto,
  ) {
    return this.garmentsService.update(req.tenantId, id, req.user.userId, dto);
  }

  @Get('garments/scan/:code')
  @ApiOperation({ summary: 'Scan barcode/QR code to lookup garment item or order' })
  @RequirePermissions(PermissionCode.GARMENT_VIEW)
  async scanCode(@Req() req: any, @Param('code') code: string) {
    const userBranchIds = req.userBranchIds || [];
    return this.garmentsService.scan(req.tenantId, code, userBranchIds);
  }

  @Post('garments/scan/transition')
  @ApiOperation({ summary: 'Scan barcode to rapidly advance workstation processing stage' })
  @RequirePermissions(PermissionCode.GARMENT_UPDATE)
  async scanTransition(
    @Req() req: any,
    @Body() body: { code: string; stage: any; notes?: string },
  ) {
    const userBranchIds = req.userBranchIds || [];
    return this.garmentsService.scanTransition(
      req.tenantId,
      body.code,
      body.stage,
      req.user.userId,
      body.notes,
      userBranchIds,
    );
  }
}
