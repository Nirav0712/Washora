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
import { DeliveriesService } from './deliveries.service';
import { CreateDeliveryDto, UpdateDeliveryDto } from './dto/create-delivery.dto';
import {
  AssignDeliveryDto,
  FailDeliveryDto,
  RescheduleDeliveryDto,
  CancelDeliveryDto,
  RecordCollectionDto,
  SubmitProofDto,
} from './dto/delivery-actions.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PermissionCode, DeliveryStatus, LogisticsPriority } from '@washora/shared';

@ApiTags('Deliveries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  private getTenantId(req: any): string {
    return req.user?.membership?.tenantId || req.user?.tenantId;
  }

  private getUserId(req: any): string {
    return req.user?._id || req.user?.id || req.user?.userId;
  }

  @Post()
  @RequirePermissions(PermissionCode.DELIVERY_CREATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new delivery request' })
  async create(@Req() req: any, @Body() dto: CreateDeliveryDto) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.deliveriesService.create(tenantId, dto, userId);
  }

  @Get()
  @RequirePermissions(PermissionCode.DELIVERY_VIEW)
  @ApiOperation({ summary: 'List delivery requests with pagination and filters' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'orderId', required: false })
  @ApiQuery({ name: 'assignedAgentId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: DeliveryStatus })
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
    @Query('status') status?: DeliveryStatus,
    @Query('priority') priority?: LogisticsPriority,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const tenantId = this.getTenantId(req);
    return this.deliveriesService.findAll(tenantId, {
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
  @RequirePermissions(PermissionCode.DELIVERY_VIEW)
  @ApiOperation({ summary: 'Get delivery request details by ID' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    return this.deliveriesService.findOne(tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.DELIVERY_MANAGE)
  @ApiOperation({ summary: 'Update delivery request details' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.deliveriesService.update(tenantId, id, dto, userId);
  }

  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PermissionCode.DELIVERY_ASSIGN)
  @ApiOperation({ summary: 'Assign delivery agent to delivery request' })
  async assign(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: AssignDeliveryDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.deliveriesService.assign(tenantId, id, dto, userId);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PermissionCode.DELIVERY_COMPLETE)
  @ApiOperation({ summary: 'Mark delivery as out for delivery' })
  async start(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.deliveriesService.start(tenantId, id, userId);
  }

  @Post(':id/arrive')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PermissionCode.DELIVERY_COMPLETE)
  @ApiOperation({ summary: 'Mark agent arrived at delivery location' })
  async arrive(@Req() req: any, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.deliveriesService.arrive(tenantId, id, userId);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PermissionCode.DELIVERY_COMPLETE)
  @ApiOperation({ summary: 'Mark garments delivered and complete delivery request' })
  async complete(
    @Req() req: any,
    @Param('id') id: string,
    @Body() proofDto?: SubmitProofDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.deliveriesService.complete(tenantId, id, proofDto, userId);
  }

  @Post(':id/collection')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PermissionCode.DELIVERY_COLLECTION)
  @ApiOperation({ summary: 'Record doorstep cash/UPI/card payment collection' })
  async recordCollection(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: RecordCollectionDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.deliveriesService.recordCollection(tenantId, id, dto, userId);
  }

  @Post(':id/proof')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PermissionCode.DELIVERY_PROOF)
  @ApiOperation({ summary: 'Submit or update proof of delivery' })
  async submitProof(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: SubmitProofDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.deliveriesService.submitProof(tenantId, id, dto, userId);
  }

  @Post(':id/fail')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PermissionCode.DELIVERY_COMPLETE)
  @ApiOperation({ summary: 'Record failed delivery attempt' })
  async fail(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: FailDeliveryDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.deliveriesService.fail(tenantId, id, dto, userId);
  }

  @Post(':id/reschedule')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PermissionCode.DELIVERY_MANAGE)
  @ApiOperation({ summary: 'Reschedule delivery request' })
  async reschedule(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: RescheduleDeliveryDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.deliveriesService.reschedule(tenantId, id, dto, userId);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PermissionCode.DELIVERY_CANCEL)
  @ApiOperation({ summary: 'Cancel delivery request' })
  async cancel(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CancelDeliveryDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.deliveriesService.cancel(tenantId, id, dto, userId);
  }
}
