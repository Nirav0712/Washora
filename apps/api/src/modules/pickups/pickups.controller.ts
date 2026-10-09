import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PickupsService } from './pickups.service';
import { CreatePickupDto, UpdatePickupDto } from './dto/create-pickup.dto';
import {
  AssignPickupDto,
  FailPickupDto,
  ReschedulePickupDto,
  CancelPickupDto,
} from './dto/pickup-actions.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PermissionCode, PickupStatus, LogisticsPriority } from '@washora/shared';

@ApiTags('Pickups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('pickups')
export class PickupsController {
  constructor(private readonly pickupsService: PickupsService) {}

  private getTenantId(req: any): string {
    return req.user?.membership?.tenantId || req.user?.tenantId;
  }

  private getUserId(req: any): string {
    return req.user?._id || req.user?.id || req.user?.userId;
  }

  @Post()
  @RequirePermissions(PermissionCode.PICKUP_CREATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new pickup request' })
  async create(@Req() req: any, @Body() dto: CreatePickupDto) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.pickupsService.create(tenantId, dto, userId);
  }

  @Get()
  @RequirePermissions(PermissionCode.PICKUP_VIEW)
  @ApiOperation({ summary: 'List pickup requests with pagination and filters' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'orderId', required: false })
  @ApiQuery({ name: 'assignedAgentId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: PickupStatus })
  @ApiQuery({ name: 'priority', required: false, enum: LogisticsPriority })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Req() req: any,
    @Query('branchId') branchId?: string,
    @Query('customerId') customerId?: string,
    @Query('orderId') orderId?: string,
    @Query('assignedAgentId') assignedAgentId?: string,
    @Query('status') status?: PickupStatus,
    @Query('priority') priority?: LogisticsPriority,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const tenantId = this.getTenantId(req);
    return this.pickupsService.findAll(tenantId, {
      branchId,
      customerId,
      orderId,
      assignedAgentId,
      status,
      priority,
      date,
      startDate,
      endDate,
      search,
      page,
      limit,
    });
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.PICKUP_VIEW)
  @ApiOperation({ summary: 'Get pickup request details by ID' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    return this.pickupsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.PICKUP_MANAGE)
  @ApiOperation({ summary: 'Update pickup request details' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePickupDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.pickupsService.update(tenantId, id, dto, userId);
  }

  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PermissionCode.PICKUP_ASSIGN)
  @ApiOperation({ summary: 'Assign delivery agent to pickup request' })
  async assign(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: AssignPickupDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.pickupsService.assign(tenantId, id, dto, userId);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PermissionCode.PICKUP_COMPLETE)
  @ApiOperation({ summary: 'Mark pickup as out for pickup' })
  async start(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.pickupsService.start(tenantId, id, userId);
  }

  @Post(':id/arrive')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PermissionCode.PICKUP_COMPLETE)
  @ApiOperation({ summary: 'Mark agent arrived at pickup location' })
  async arrive(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.pickupsService.arrive(tenantId, id, userId);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PermissionCode.PICKUP_COMPLETE)
  @ApiOperation({ summary: 'Mark garments picked up and complete pickup request' })
  async complete(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.pickupsService.complete(tenantId, id, userId);
  }

  @Post(':id/fail')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PermissionCode.PICKUP_COMPLETE)
  @ApiOperation({ summary: 'Record failed pickup attempt' })
  async fail(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: FailPickupDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.pickupsService.fail(tenantId, id, dto, userId);
  }

  @Post(':id/reschedule')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PermissionCode.PICKUP_MANAGE)
  @ApiOperation({ summary: 'Reschedule pickup request' })
  async reschedule(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ReschedulePickupDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.pickupsService.reschedule(tenantId, id, dto, userId);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PermissionCode.PICKUP_CANCEL)
  @ApiOperation({ summary: 'Cancel pickup request' })
  async cancel(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CancelPickupDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.pickupsService.cancel(tenantId, id, dto, userId);
  }
}
