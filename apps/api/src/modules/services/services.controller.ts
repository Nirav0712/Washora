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
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard, TenantGuard, PermissionsGuard } from '../../common/guards';
import { RequirePermissions } from '../../common/decorators';
import { PermissionCode } from '@washora/shared';

@ApiTags('Services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tenant-specific laundry services' })
  @RequirePermissions(PermissionCode.SERVICE_VIEW)
  async getServices(@Req() req: any) {
    return this.servicesService.findAll(req.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service details by ID' })
  @RequirePermissions(PermissionCode.SERVICE_VIEW)
  async getServiceById(@Req() req: any, @Param('id') id: string) {
    return this.servicesService.findById(req.tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new service' })
  @RequirePermissions(PermissionCode.SERVICE_CREATE)
  async createService(@Req() req: any, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(req.tenantId, req.user.userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update service details' })
  @RequirePermissions(PermissionCode.SERVICE_UPDATE)
  async updateService(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(req.tenantId, id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate / soft delete a service' })
  @RequirePermissions(PermissionCode.SERVICE_DELETE)
  async deleteService(@Req() req: any, @Param('id') id: string) {
    return this.servicesService.delete(req.tenantId, id, req.user.userId);
  }
}
