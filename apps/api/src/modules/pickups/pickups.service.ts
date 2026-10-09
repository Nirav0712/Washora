import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PickupRequest, PickupRequestDocument } from '../../schemas/pickup-request.schema';
import { Customer, CustomerDocument } from '../../schemas/customer.schema';
import { Branch, BranchDocument } from '../../schemas/branch.schema';
import { Order, OrderDocument } from '../../schemas/order.schema';
import { StaffProfile, StaffProfileDocument } from '../../schemas/staff-profile.schema';
import { CounterService } from '../../common/services/counter.service';
import { AuditService } from '../audit/audit.service';
import { NotificationEventService } from '../notifications/notification-event.service';
import { CreatePickupDto, UpdatePickupDto } from './dto/create-pickup.dto';
import {
  AssignPickupDto,
  FailPickupDto,
  ReschedulePickupDto,
  CancelPickupDto,
} from './dto/pickup-actions.dto';
import {
  PickupStatus,
  LogisticsPriority,
  NotificationEventType,
} from '@washora/shared';

@Injectable()
export class PickupsService {
  private readonly logger = new Logger(PickupsService.name);

  constructor(
    @InjectModel(PickupRequest.name)
    private pickupModel: Model<PickupRequestDocument>,
    @InjectModel(Customer.name)
    private customerModel: Model<CustomerDocument>,
    @InjectModel(Branch.name)
    private branchModel: Model<BranchDocument>,
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    @InjectModel(StaffProfile.name)
    private staffModel: Model<StaffProfileDocument>,
    private counterService: CounterService,
    private auditService: AuditService,
    private notificationEventService: NotificationEventService,
  ) {}

  // ==========================================
  // CREATE PICKUP REQUEST
  // ==========================================

  async create(tenantId: string, dto: CreatePickupDto, userId?: string): Promise<PickupRequestDocument> {
    if (!Types.ObjectId.isValid(dto.branchId) || !Types.ObjectId.isValid(dto.customerId)) {
      throw new BadRequestException('Invalid branch or customer ID format');
    }

    const tId = new Types.ObjectId(tenantId);

    const [branch, customer] = await Promise.all([
      this.branchModel.findOne({ _id: new Types.ObjectId(dto.branchId), tenantId: tId }).exec(),
      this.customerModel.findOne({ _id: new Types.ObjectId(dto.customerId), tenantId: tId, isDeleted: { $ne: true } }).exec(),
    ]);

    if (!branch) throw new NotFoundException('Branch not found');
    if (!customer) throw new NotFoundException('Customer not found');

    let orderObjectId: Types.ObjectId | undefined;
    if (dto.orderId) {
      if (!Types.ObjectId.isValid(dto.orderId)) {
        throw new BadRequestException('Invalid order ID format');
      }
      const order = await this.orderModel.findOne({ _id: new Types.ObjectId(dto.orderId), tenantId: tId }).exec();
      if (!order) throw new NotFoundException('Order not found');
      orderObjectId = order._id;
    }

    // Resolve address snapshot
    let addressSnapshot = dto.pickupAddress;
    let addressObjectId: Types.ObjectId | undefined;

    if (dto.pickupAddressId && Types.ObjectId.isValid(dto.pickupAddressId)) {
      addressObjectId = new Types.ObjectId(dto.pickupAddressId);
      const foundAddr = (customer.addresses || []).find((a: any) => a._id?.toString() === dto.pickupAddressId);
      if (foundAddr) {
        addressSnapshot = {
          label: foundAddr.label,
          name: foundAddr.name || customer.name,
          phone: foundAddr.phone || customer.phone,
          addressLine1: foundAddr.addressLine1,
          addressLine2: foundAddr.addressLine2,
          area: foundAddr.area,
          city: foundAddr.city,
          state: foundAddr.state,
          country: foundAddr.country,
          pincode: foundAddr.pincode,
          landmark: foundAddr.landmark,
          latitude: foundAddr.latitude,
          longitude: foundAddr.longitude,
        };
      }
    }

    if (!addressSnapshot || !addressSnapshot.addressLine1) {
      const defaultAddr = (customer.addresses || []).find((a: any) => a.isDefault) || customer.addresses?.[0];
      if (defaultAddr && defaultAddr.addressLine1) {
        addressSnapshot = {
          label: defaultAddr.label,
          name: defaultAddr.name || customer.name,
          phone: defaultAddr.phone || customer.phone,
          addressLine1: defaultAddr.addressLine1,
          addressLine2: defaultAddr.addressLine2,
          area: defaultAddr.area,
          city: defaultAddr.city,
          state: defaultAddr.state,
          country: defaultAddr.country,
          pincode: defaultAddr.pincode,
          landmark: defaultAddr.landmark,
          latitude: defaultAddr.latitude,
          longitude: defaultAddr.longitude,
        };
      } else {
        throw new BadRequestException('Pickup address must be provided or customer must have a saved address');
      }
    }

    // Agent validation
    let agentObjectId: Types.ObjectId | undefined;
    let initialStatus = PickupStatus.SCHEDULED;

    if (dto.assignedAgentId) {
      if (!Types.ObjectId.isValid(dto.assignedAgentId)) {
        throw new BadRequestException('Invalid agent ID format');
      }
      const agent = await this.staffModel.findOne({
        _id: new Types.ObjectId(dto.assignedAgentId),
        tenantId: tId,
        isActive: true,
      }).exec();

      if (!agent) {
        throw new BadRequestException('Assigned delivery agent not found or inactive');
      }
      agentObjectId = agent._id;
      initialStatus = PickupStatus.ASSIGNED;
    }

    const pickupNumber = await this.counterService.generatePickupNumber(tenantId);

    const pickup = new this.pickupModel({
      tenantId: tId,
      branchId: branch._id,
      pickupNumber,
      orderId: orderObjectId,
      customerId: customer._id,
      pickupAddressId: addressObjectId,
      pickupAddress: addressSnapshot,
      scheduledDate: dto.scheduledDate,
      scheduledTimeFrom: dto.scheduledTimeFrom,
      scheduledTimeTo: dto.scheduledTimeTo,
      assignedAgentId: agentObjectId,
      status: initialStatus,
      priority: dto.priority || LogisticsPriority.NORMAL,
      specialInstructions: dto.specialInstructions,
      customerNotes: dto.customerNotes,
      internalNotes: dto.internalNotes,
      attemptCount: 0,
      attempts: [],
      rescheduleHistory: [],
      createdBy: userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined,
    });

    const saved = await pickup.save();

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      branchId: branch._id.toString(),
      action: 'PICKUP_CREATED',
      entity: 'PickupRequest',
      entityId: saved._id.toString(),
      metadata: { pickupNumber, scheduledDate: dto.scheduledDate, customerId: customer._id.toString() },
    });

    try {
      await this.notificationEventService.emit({
        tenantId,
        branchId: branch._id.toString(),
        customerId: customer._id.toString(),
        eventType: NotificationEventType.PICKUP_SCHEDULED,
        actorUserId: userId,
        variables: {
          customerName: customer.name,
          customerPhone: customer.phone,
          pickupNumber,
          pickupDate: dto.scheduledDate,
          pickupTime: dto.scheduledTimeFrom ? `${dto.scheduledTimeFrom} - ${dto.scheduledTimeTo || ''}` : 'During Business Hours',
        },
      });
    } catch (notifErr: any) {
      this.logger.warn(`Failed to emit PICKUP_SCHEDULED notification: ${notifErr.message}`);
    }

    return this.findOne(tenantId, saved._id.toString());
  }

  // ==========================================
  // FIND ALL / QUERY PICKUPS
  // ==========================================

  async findAll(
    tenantId: string,
    query: {
      branchId?: string;
      customerId?: string;
      orderId?: string;
      assignedAgentId?: string;
      status?: PickupStatus;
      priority?: LogisticsPriority;
      date?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ data: PickupRequestDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      tenantId: new Types.ObjectId(tenantId),
    };

    if (query.branchId && Types.ObjectId.isValid(query.branchId)) {
      filter.branchId = new Types.ObjectId(query.branchId);
    }

    if (query.customerId && Types.ObjectId.isValid(query.customerId)) {
      filter.customerId = new Types.ObjectId(query.customerId);
    }

    if (query.orderId && Types.ObjectId.isValid(query.orderId)) {
      filter.orderId = new Types.ObjectId(query.orderId);
    }

    if (query.assignedAgentId && Types.ObjectId.isValid(query.assignedAgentId)) {
      filter.assignedAgentId = new Types.ObjectId(query.assignedAgentId);
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.priority) {
      filter.priority = query.priority;
    }

    if (query.date) {
      filter.scheduledDate = query.date;
    } else if (query.startDate || query.endDate) {
      filter.scheduledDate = {};
      if (query.startDate) filter.scheduledDate.$gte = query.startDate;
      if (query.endDate) filter.scheduledDate.$lte = query.endDate;
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { pickupNumber: searchRegex },
        { 'pickupAddress.addressLine1': searchRegex },
        { 'pickupAddress.area': searchRegex },
        { 'pickupAddress.city': searchRegex },
        { specialInstructions: searchRegex },
      ];
    }

    const [data, total] = await Promise.all([
      this.pickupModel
        .find(filter)
        .populate('branchId', 'name code')
        .populate('customerId', 'name phone email customerCode')
        .populate('orderId', 'orderNumber grandTotal status paymentStatus')
        .populate('assignedAgentId', 'employeeCode fullName phone')
        .sort({ scheduledDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.pickupModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  // ==========================================
  // FIND ONE PICKUP
  // ==========================================

  async findOne(tenantId: string, id: string): Promise<PickupRequestDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid pickup ID format');
    }

    const pickup = await this.pickupModel
      .findOne({
        _id: new Types.ObjectId(id),
        tenantId: new Types.ObjectId(tenantId),
      })
      .populate('branchId', 'name code address phone')
      .populate('customerId', 'name phone email addresses')
      .populate('orderId', 'orderNumber totalAmount paidAmount dueAmount status paymentStatus items')
      .populate({
        path: 'assignedAgentId',
        select: 'employeeCode designation primaryBranchId userId',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .populate('attempts.agentId', 'employeeCode designation')
      .populate('rescheduleHistory.changedBy', 'name email')
      .exec();

    if (!pickup) {
      throw new NotFoundException('Pickup request not found');
    }

    return pickup;
  }

  // ==========================================
  // UPDATE PICKUP
  // ==========================================

  async update(tenantId: string, id: string, dto: UpdatePickupDto, userId?: string): Promise<PickupRequestDocument> {
    const pickup = await this.findOne(tenantId, id);

    if (pickup.status === PickupStatus.PICKED_UP || pickup.status === PickupStatus.CANCELLED) {
      throw new BadRequestException(`Cannot update pickup in ${pickup.status} status`);
    }

    if (dto.scheduledDate) pickup.scheduledDate = dto.scheduledDate;
    if (dto.scheduledTimeFrom !== undefined) pickup.scheduledTimeFrom = dto.scheduledTimeFrom;
    if (dto.scheduledTimeTo !== undefined) pickup.scheduledTimeTo = dto.scheduledTimeTo;
    if (dto.priority) pickup.priority = dto.priority;
    if (dto.specialInstructions !== undefined) pickup.specialInstructions = dto.specialInstructions;
    if (dto.customerNotes !== undefined) pickup.customerNotes = dto.customerNotes;
    if (dto.internalNotes !== undefined) pickup.internalNotes = dto.internalNotes;

    if (dto.assignedAgentId !== undefined) {
      if (dto.assignedAgentId && Types.ObjectId.isValid(dto.assignedAgentId)) {
        const agent = await this.staffModel.findOne({
          _id: new Types.ObjectId(dto.assignedAgentId),
          tenantId: new Types.ObjectId(tenantId),
          isActive: true,
        }).exec();
        if (!agent) throw new BadRequestException('Assigned delivery agent not found or inactive');
        pickup.assignedAgentId = agent._id;
        if (pickup.status === PickupStatus.REQUESTED || pickup.status === PickupStatus.SCHEDULED) {
          pickup.status = PickupStatus.ASSIGNED;
        }
      } else {
        pickup.assignedAgentId = undefined;
        if (pickup.status === PickupStatus.ASSIGNED) {
          pickup.status = PickupStatus.SCHEDULED;
        }
      }
    }

    if (dto.pickupAddress) {
      pickup.pickupAddress = { ...pickup.pickupAddress, ...dto.pickupAddress };
    }

    pickup.updatedBy = userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined;
    await pickup.save();

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      branchId: pickup.branchId.toString(),
      action: 'PICKUP_UPDATED',
      entity: 'PickupRequest',
      entityId: id,
      metadata: { pickupNumber: pickup.pickupNumber },
    });

    return this.findOne(tenantId, id);
  }

  // ==========================================
  // ASSIGN AGENT
  // ==========================================

  async assign(tenantId: string, id: string, dto: AssignPickupDto, userId?: string): Promise<PickupRequestDocument> {
    const targetAgentId = dto.assignedAgentId || dto.agentId;
    if (!targetAgentId || !Types.ObjectId.isValid(targetAgentId)) {
      throw new BadRequestException('Invalid delivery agent ID');
    }

    const [pickup, agent] = await Promise.all([
      this.findOne(tenantId, id),
      this.staffModel.findOne({
        _id: new Types.ObjectId(targetAgentId),
        tenantId: new Types.ObjectId(tenantId),
        isActive: true,
      }).exec(),
    ]);

    if (!agent) {
      throw new BadRequestException('Delivery agent not found or inactive');
    }

    if (pickup.status === PickupStatus.PICKED_UP || pickup.status === PickupStatus.CANCELLED) {
      throw new BadRequestException(`Cannot assign pickup in ${pickup.status} status`);
    }

    pickup.assignedAgentId = agent._id;
    pickup.status = PickupStatus.ASSIGNED;
    if (dto.notes) {
      pickup.internalNotes = `${pickup.internalNotes ? pickup.internalNotes + ' | ' : ''}${dto.notes}`;
    }
    pickup.updatedBy = userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined;

    await pickup.save();

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      branchId: pickup.branchId.toString(),
      action: 'PICKUP_ASSIGNED',
      entity: 'PickupRequest',
      entityId: id,
      metadata: { agentId: targetAgentId, employeeCode: agent.employeeCode },
    });

    return this.findOne(tenantId, id);
  }

  // ==========================================
  // START PICKUP (OUT_FOR_PICKUP)
  // ==========================================

  async start(tenantId: string, id: string, userId?: string): Promise<PickupRequestDocument> {
    const pickup = await this.findOne(tenantId, id);

    if (
      pickup.status !== PickupStatus.ASSIGNED &&
      pickup.status !== PickupStatus.SCHEDULED &&
      pickup.status !== PickupStatus.REQUESTED
    ) {
      throw new BadRequestException(`Cannot start pickup in ${pickup.status} status`);
    }

    pickup.status = PickupStatus.OUT_FOR_PICKUP;
    pickup.outForPickupAt = new Date();
    pickup.updatedBy = userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined;

    await pickup.save();

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      branchId: pickup.branchId.toString(),
      action: 'PICKUP_STARTED',
      entity: 'PickupRequest',
      entityId: id,
      metadata: { pickupNumber: pickup.pickupNumber },
    });

    try {
      await this.notificationEventService.emit({
        tenantId,
        branchId: pickup.branchId.toString(),
        customerId: (pickup.customerId as any)?._id?.toString() || pickup.customerId?.toString(),
        eventType: NotificationEventType.PICKUP_OUT_FOR_PICKUP,
        actorUserId: userId,
        variables: {
          pickupNumber: pickup.pickupNumber,
          agentName: (pickup.assignedAgentId as any)?.fullName || 'Assigned Driver',
        },
      });
    } catch (notifErr: any) {
      this.logger.warn(`Failed to emit PICKUP_OUT_FOR_PICKUP notification: ${notifErr.message}`);
    }

    return this.findOne(tenantId, id);
  }

  // ==========================================
  // MARK ARRIVED
  // ==========================================

  async arrive(tenantId: string, id: string, userId?: string): Promise<PickupRequestDocument> {
    const pickup = await this.findOne(tenantId, id);

    if (pickup.status !== PickupStatus.OUT_FOR_PICKUP) {
      throw new BadRequestException(`Cannot mark arrived from ${pickup.status} status (must be OUT_FOR_PICKUP)`);
    }

    pickup.status = PickupStatus.ARRIVED;
    pickup.arrivedAt = new Date();
    pickup.updatedBy = userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined;

    await pickup.save();

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      branchId: pickup.branchId.toString(),
      action: 'PICKUP_ARRIVED',
      entity: 'PickupRequest',
      entityId: id,
      metadata: { pickupNumber: pickup.pickupNumber },
    });

    return this.findOne(tenantId, id);
  }

  // ==========================================
  // COMPLETE PICKUP (PICKED_UP)
  // ==========================================

  async complete(tenantId: string, id: string, userId?: string): Promise<PickupRequestDocument> {
    const pickup = await this.findOne(tenantId, id);

    if (
      pickup.status !== PickupStatus.ARRIVED &&
      pickup.status !== PickupStatus.OUT_FOR_PICKUP &&
      pickup.status !== PickupStatus.ASSIGNED
    ) {
      throw new BadRequestException(`Cannot complete pickup in ${pickup.status} status`);
    }

    pickup.status = PickupStatus.PICKED_UP;
    pickup.pickedUpAt = new Date();
    pickup.updatedBy = userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined;

    await pickup.save();

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      branchId: pickup.branchId.toString(),
      action: 'PICKUP_COMPLETED',
      entity: 'PickupRequest',
      entityId: id,
      metadata: { pickupNumber: pickup.pickupNumber },
    });

    try {
      await this.notificationEventService.emit({
        tenantId,
        branchId: pickup.branchId.toString(),
        customerId: (pickup.customerId as any)?._id?.toString() || pickup.customerId?.toString(),
        eventType: NotificationEventType.PICKUP_COMPLETED,
        actorUserId: userId,
        variables: {
          pickupNumber: pickup.pickupNumber,
          agentName: (pickup.assignedAgentId as any)?.fullName || 'Driver',
        },
      });
    } catch (notifErr: any) {
      this.logger.warn(`Failed to emit PICKUP_COMPLETED notification: ${notifErr.message}`);
    }

    return this.findOne(tenantId, id);
  }

  // ==========================================
  // FAIL PICKUP
  // ==========================================

  async fail(tenantId: string, id: string, dto: FailPickupDto, userId?: string): Promise<PickupRequestDocument> {
    const pickup = await this.findOne(tenantId, id);

    if (pickup.status === PickupStatus.PICKED_UP || pickup.status === PickupStatus.CANCELLED) {
      throw new BadRequestException(`Cannot fail pickup in ${pickup.status} status`);
    }

    const attemptNumber = (pickup.attemptCount || 0) + 1;
    const attemptedAt = new Date();

    pickup.status = PickupStatus.FAILED;
    pickup.attemptCount = attemptNumber;
    pickup.lastAttemptAt = attemptedAt;
    const noteText = dto.notes || dto.note;
    const assignedAgentObjId = (pickup.assignedAgentId as any)?._id || (Types.ObjectId.isValid(pickup.assignedAgentId?.toString()) ? pickup.assignedAgentId : undefined);

    pickup.attempts.push({
      attemptNumber,
      attemptedAt,
      agentId: assignedAgentObjId ? new Types.ObjectId(assignedAgentObjId.toString()) : undefined,
      reason: dto.reason,
      notes: noteText,
    });

    pickup.updatedBy = userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined;
    await pickup.save();

    const bIdStr = (pickup.branchId as any)?._id?.toString() || pickup.branchId?.toString();
    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      branchId: bIdStr,
      action: 'PICKUP_FAILED',
      entity: 'PickupRequest',
      entityId: id,
      metadata: { reason: dto.reason, attemptNumber, notes: noteText },
    });

    try {
      await this.notificationEventService.emit({
        tenantId,
        branchId: bIdStr,
        customerId: (pickup.customerId as any)?._id?.toString() || pickup.customerId?.toString(),
        eventType: NotificationEventType.PICKUP_FAILED,
        actorUserId: userId,
        variables: {
          pickupNumber: pickup.pickupNumber,
          failureReason: dto.reason || noteText || 'Customer unavailable',
        },
      });
    } catch (notifErr: any) {
      this.logger.warn(`Failed to emit PICKUP_FAILED notification: ${notifErr.message}`);
    }

    return this.findOne(tenantId, id);
  }

  // ==========================================
  // RESCHEDULE PICKUP
  // ==========================================

  async reschedule(tenantId: string, id: string, dto: ReschedulePickupDto, userId?: string): Promise<PickupRequestDocument> {
    const pickup = await this.findOne(tenantId, id);

    if (pickup.status === PickupStatus.PICKED_UP || pickup.status === PickupStatus.CANCELLED) {
      throw new BadRequestException(`Cannot reschedule pickup in ${pickup.status} status`);
    }

    const newDate = dto.newDate || dto.scheduledDate;
    const newTimeFrom = dto.newTimeFrom || dto.scheduledTimeFrom;
    const newTimeTo = dto.newTimeTo || dto.scheduledTimeTo;
    const reasonText = dto.reason || dto.notes;

    if (!newDate) {
      throw new BadRequestException('New scheduled date is required');
    }

    pickup.rescheduleHistory.push({
      previousDate: pickup.scheduledDate,
      previousTimeFrom: pickup.scheduledTimeFrom,
      previousTimeTo: pickup.scheduledTimeTo,
      newDate,
      newTimeFrom,
      newTimeTo,
      reason: reasonText,
      changedBy: userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined,
      changedAt: new Date(),
    });

    pickup.scheduledDate = newDate;
    if (newTimeFrom !== undefined) pickup.scheduledTimeFrom = newTimeFrom;
    if (newTimeTo !== undefined) pickup.scheduledTimeTo = newTimeTo;
    pickup.status = PickupStatus.SCHEDULED;
    pickup.updatedBy = userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined;

    await pickup.save();

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      branchId: pickup.branchId.toString(),
      action: 'PICKUP_RESCHEDULED',
      entity: 'PickupRequest',
      entityId: id,
      metadata: {
        previousDate: pickup.scheduledDate,
        newDate,
        reason: reasonText,
      },
    });

    return this.findOne(tenantId, id);
  }

  // ==========================================
  // CANCEL PICKUP
  // ==========================================

  async cancel(tenantId: string, id: string, dto: CancelPickupDto, userId?: string): Promise<PickupRequestDocument> {
    const pickup = await this.findOne(tenantId, id);

    if (pickup.status === PickupStatus.PICKED_UP) {
      throw new BadRequestException('Cannot cancel pickup that is already completed (PICKED_UP)');
    }

    const cancelReason = dto.reason || dto.notes;
    pickup.status = PickupStatus.CANCELLED;
    pickup.cancellationReason = cancelReason;
    if (cancelReason) {
      pickup.internalNotes = pickup.internalNotes ? `${pickup.internalNotes}\nCancellation: ${cancelReason}` : `Cancellation: ${cancelReason}`;
    }
    pickup.updatedBy = userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined;

    await pickup.save();

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      branchId: pickup.branchId.toString(),
      action: 'PICKUP_CANCELLED',
      entity: 'PickupRequest',
      entityId: id,
      metadata: { reason: cancelReason },
    });

    return this.findOne(tenantId, id);
  }
}
