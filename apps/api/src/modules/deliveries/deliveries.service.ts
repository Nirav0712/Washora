import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DeliveryRequest, DeliveryRequestDocument } from '../../schemas/delivery-request.schema';
import { Customer, CustomerDocument } from '../../schemas/customer.schema';
import { Branch, BranchDocument } from '../../schemas/branch.schema';
import { Order, OrderDocument } from '../../schemas/order.schema';
import { StaffProfile, StaffProfileDocument } from '../../schemas/staff-profile.schema';
import { Payment, PaymentDocument } from '../../schemas/payment.schema';
import { CounterService } from '../../common/services/counter.service';
import { AuditService } from '../audit/audit.service';
import { NotificationEventService } from '../notifications/notification-event.service';
import { CreateDeliveryDto, UpdateDeliveryDto } from './dto/create-delivery.dto';
import {
  AssignDeliveryDto,
  FailDeliveryDto,
  RescheduleDeliveryDto,
  CancelDeliveryDto,
  RecordCollectionDto,
  SubmitProofDto,
} from './dto/delivery-actions.dto';
import {
  DeliveryStatus,
  LogisticsPriority,
  OrderStatus,
  PaymentStatus,
  NotificationEventType,
} from '@washora/shared';

@Injectable()
export class DeliveriesService {
  private readonly logger = new Logger(DeliveriesService.name);

  constructor(
    @InjectModel(DeliveryRequest.name)
    private deliveryModel: Model<DeliveryRequestDocument>,
    @InjectModel(Customer.name)
    private customerModel: Model<CustomerDocument>,
    @InjectModel(Branch.name)
    private branchModel: Model<BranchDocument>,
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    @InjectModel(StaffProfile.name)
    private staffModel: Model<StaffProfileDocument>,
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,
    private counterService: CounterService,
    private auditService: AuditService,
    private notificationEventService: NotificationEventService,
  ) {}

  // ==========================================
  // CREATE DELIVERY REQUEST
  // ==========================================

  async create(tenantId: string, dto: CreateDeliveryDto, userId?: string): Promise<DeliveryRequestDocument> {
    if (!Types.ObjectId.isValid(dto.branchId) || !Types.ObjectId.isValid(dto.orderId)) {
      throw new BadRequestException('Invalid branch or order ID format');
    }

    const tId = new Types.ObjectId(tenantId);

    const [branch, order] = await Promise.all([
      this.branchModel.findOne({ _id: new Types.ObjectId(dto.branchId), tenantId: tId }).exec(),
      this.orderModel.findOne({ _id: new Types.ObjectId(dto.orderId), tenantId: tId, isDeleted: { $ne: true } }).exec(),
    ]);

    if (!branch) throw new NotFoundException('Branch not found');
    if (!order) throw new NotFoundException('Order not found');

    const customerIdStr = dto.customerId || order.customerId?.toString();
    if (!customerIdStr || !Types.ObjectId.isValid(customerIdStr)) {
      throw new BadRequestException('Valid Customer ID is required');
    }

    const customer = await this.customerModel.findOne({
      _id: new Types.ObjectId(customerIdStr),
      tenantId: tId,
      isDeleted: { $ne: true },
    }).exec();

    if (!customer) throw new NotFoundException('Customer not found');

    // Resolve address snapshot
    let addressSnapshot = dto.deliveryAddress;
    let addressObjectId: Types.ObjectId | undefined;

    if (dto.deliveryAddressId && Types.ObjectId.isValid(dto.deliveryAddressId)) {
      addressObjectId = new Types.ObjectId(dto.deliveryAddressId);
      const foundAddr = (customer.addresses || []).find((a: any) => a._id?.toString() === dto.deliveryAddressId);
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
        throw new BadRequestException('Delivery address must be provided or customer must have a saved address');
      }
    }

    // Agent validation
    let agentObjectId: Types.ObjectId | undefined;
    let initialStatus = DeliveryStatus.SCHEDULED;

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
      initialStatus = DeliveryStatus.ASSIGNED;
    }

    const deliveryNumber = await this.counterService.generateDeliveryNumber(tenantId);

    const delivery = new this.deliveryModel({
      tenantId: tId,
      branchId: branch._id,
      deliveryNumber,
      orderId: order._id,
      customerId: customer._id,
      deliveryAddressId: addressObjectId,
      deliveryAddress: addressSnapshot,
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
      collectionAmount: 0,
      createdBy: userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined,
    });

    const saved = await delivery.save();

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      branchId: branch._id.toString(),
      action: 'DELIVERY_CREATED',
      entity: 'DeliveryRequest',
      entityId: saved._id.toString(),
      metadata: { deliveryNumber, orderNumber: order.orderNumber, scheduledDate: dto.scheduledDate },
    });

    try {
      await this.notificationEventService.emit({
        tenantId,
        branchId: branch._id.toString(),
        customerId: customer._id.toString(),
        orderId: order._id.toString(),
        eventType: NotificationEventType.DELIVERY_SCHEDULED,
        actorUserId: userId,
        variables: {
          customerName: customer.name,
          customerPhone: customer.phone,
          deliveryNumber,
          orderNumber: order.orderNumber,
          deliveryDate: dto.scheduledDate,
          deliveryTime: dto.scheduledTimeFrom ? `${dto.scheduledTimeFrom} - ${dto.scheduledTimeTo || ''}` : 'During Business Hours',
        },
      });
    } catch (notifErr: any) {
      this.logger.warn(`Failed to emit DELIVERY_SCHEDULED notification: ${notifErr.message}`);
    }

    return this.findOne(tenantId, saved._id.toString());
  }

  // ==========================================
  // FIND ALL / QUERY DELIVERIES
  // ==========================================

  async findAll(
    tenantId: string,
    query: {
      branchId?: string;
      customerId?: string;
      orderId?: string;
      assignedAgentId?: string;
      status?: DeliveryStatus;
      priority?: LogisticsPriority;
      date?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ data: DeliveryRequestDocument[]; total: number; page: number; limit: number; totalPages: number }> {
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
        { deliveryNumber: searchRegex },
        { 'deliveryAddress.addressLine1': searchRegex },
        { 'deliveryAddress.area': searchRegex },
        { 'deliveryAddress.city': searchRegex },
        { specialInstructions: searchRegex },
      ];
    }

    const [data, total] = await Promise.all([
      this.deliveryModel
        .find(filter)
        .populate('branchId', 'name code')
        .populate('customerId', 'name phone email customerCode')
        .populate('orderId', 'orderNumber grandTotal paidAmount dueAmount status paymentStatus')
        .populate('assignedAgentId', 'employeeCode fullName phone')
        .populate('collectionPaymentId', 'paymentNumber amount paymentMethod')
        .sort({ scheduledDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.deliveryModel.countDocuments(filter).exec(),
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
  // FIND ONE DELIVERY
  // ==========================================

  async findOne(tenantId: string, id: string): Promise<DeliveryRequestDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid delivery ID format');
    }

    const delivery = await this.deliveryModel
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
      .populate('collectionPaymentId', 'paymentNumber amount paymentMethod transactionId createdAt')
      .populate('attempts.agentId', 'employeeCode designation')
      .populate('rescheduleHistory.changedBy', 'name email')
      .exec();

    if (!delivery) {
      throw new NotFoundException('Delivery request not found');
    }

    return delivery;
  }

  // ==========================================
  // UPDATE DELIVERY
  // ==========================================

  async update(tenantId: string, id: string, dto: UpdateDeliveryDto, userId?: string): Promise<DeliveryRequestDocument> {
    const delivery = await this.findOne(tenantId, id);

    if (delivery.status === DeliveryStatus.DELIVERED || delivery.status === DeliveryStatus.CANCELLED) {
      throw new BadRequestException(`Cannot update delivery in ${delivery.status} status`);
    }

    if (dto.scheduledDate) delivery.scheduledDate = dto.scheduledDate;
    if (dto.scheduledTimeFrom !== undefined) delivery.scheduledTimeFrom = dto.scheduledTimeFrom;
    if (dto.scheduledTimeTo !== undefined) delivery.scheduledTimeTo = dto.scheduledTimeTo;
    if (dto.priority) delivery.priority = dto.priority;
    if (dto.specialInstructions !== undefined) delivery.specialInstructions = dto.specialInstructions;
    if (dto.customerNotes !== undefined) delivery.customerNotes = dto.customerNotes;
    if (dto.internalNotes !== undefined) delivery.internalNotes = dto.internalNotes;

    if (dto.assignedAgentId !== undefined) {
      if (dto.assignedAgentId && Types.ObjectId.isValid(dto.assignedAgentId)) {
        const agent = await this.staffModel.findOne({
          _id: new Types.ObjectId(dto.assignedAgentId),
          tenantId: new Types.ObjectId(tenantId),
          isActive: true,
        }).exec();
        if (!agent) throw new BadRequestException('Assigned delivery agent not found or inactive');
        delivery.assignedAgentId = agent._id;
        if (delivery.status === DeliveryStatus.REQUESTED || delivery.status === DeliveryStatus.SCHEDULED) {
          delivery.status = DeliveryStatus.ASSIGNED;
        }
      } else {
        delivery.assignedAgentId = undefined;
        if (delivery.status === DeliveryStatus.ASSIGNED) {
          delivery.status = DeliveryStatus.SCHEDULED;
        }
      }
    }

    if (dto.deliveryAddress) {
      delivery.deliveryAddress = { ...delivery.deliveryAddress, ...dto.deliveryAddress };
    }

    delivery.updatedBy = userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined;
    await delivery.save();

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      branchId: delivery.branchId.toString(),
      action: 'DELIVERY_UPDATED',
      entity: 'DeliveryRequest',
      entityId: id,
      metadata: { deliveryNumber: delivery.deliveryNumber },
    });

    return this.findOne(tenantId, id);
  }

  // ==========================================
  // ASSIGN AGENT
  // ==========================================

  async assign(tenantId: string, id: string, dto: AssignDeliveryDto, userId?: string): Promise<DeliveryRequestDocument> {
    const targetAgentId = dto.assignedAgentId || dto.agentId;
    if (!targetAgentId || !Types.ObjectId.isValid(targetAgentId)) {
      throw new BadRequestException('Invalid delivery agent ID');
    }

    const [delivery, agent] = await Promise.all([
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

    if (delivery.status === DeliveryStatus.DELIVERED || delivery.status === DeliveryStatus.CANCELLED) {
      throw new BadRequestException(`Cannot assign delivery in ${delivery.status} status`);
    }

    delivery.assignedAgentId = agent._id;
    delivery.status = DeliveryStatus.ASSIGNED;
    if (dto.notes) {
      delivery.internalNotes = `${delivery.internalNotes ? delivery.internalNotes + ' | ' : ''}${dto.notes}`;
    }
    delivery.updatedBy = userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined;

    await delivery.save();

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      branchId: delivery.branchId.toString(),
      action: 'DELIVERY_ASSIGNED',
      entity: 'DeliveryRequest',
      entityId: id,
      metadata: { agentId: targetAgentId, employeeCode: agent.employeeCode },
    });

    return this.findOne(tenantId, id);
  }

  // ==========================================
  // START DELIVERY (OUT_FOR_DELIVERY)
  // ==========================================

  async start(tenantId: string, id: string, userId?: string): Promise<DeliveryRequestDocument> {
    const delivery = await this.findOne(tenantId, id);

    if (
      delivery.status !== DeliveryStatus.ASSIGNED &&
      delivery.status !== DeliveryStatus.SCHEDULED &&
      delivery.status !== DeliveryStatus.REQUESTED
    ) {
      throw new BadRequestException(`Cannot start delivery in ${delivery.status} status`);
    }

    delivery.status = DeliveryStatus.OUT_FOR_DELIVERY;
    delivery.outForDeliveryAt = new Date();
    delivery.updatedBy = userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined;

    await delivery.save();

    // Sync order status if active
    await this.orderModel.updateOne(
      { _id: delivery.orderId, tenantId: new Types.ObjectId(tenantId) },
      { $set: { status: OrderStatus.OUT_FOR_DELIVERY } },
    ).exec();

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      branchId: delivery.branchId.toString(),
      action: 'DELIVERY_STARTED',
      entity: 'DeliveryRequest',
      entityId: id,
      metadata: { deliveryNumber: delivery.deliveryNumber },
    });

    try {
      const order = await this.orderModel.findById(delivery.orderId).exec();
      await this.notificationEventService.emit({
        tenantId,
        branchId: delivery.branchId.toString(),
        customerId: (delivery.customerId as any)?._id?.toString() || delivery.customerId?.toString(),
        orderId: (delivery.orderId as any)?._id?.toString() || delivery.orderId?.toString(),
        eventType: NotificationEventType.DELIVERY_OUT_FOR_DELIVERY,
        actorUserId: userId,
        variables: {
          deliveryNumber: delivery.deliveryNumber,
          orderNumber: order?.orderNumber || '',
          dueAmount: order?.dueAmount || 0,
          agentName: (delivery.assignedAgentId as any)?.fullName || 'Delivery Driver',
        },
      });
    } catch (notifErr: any) {
      this.logger.warn(`Failed to emit DELIVERY_OUT_FOR_DELIVERY notification: ${notifErr.message}`);
    }

    return this.findOne(tenantId, id);
  }

  // ==========================================
  // MARK ARRIVED
  // ==========================================

  async arrive(tenantId: string, id: string, userId?: string): Promise<DeliveryRequestDocument> {
    const delivery = await this.findOne(tenantId, id);

    if (delivery.status !== DeliveryStatus.OUT_FOR_DELIVERY) {
      throw new BadRequestException(`Cannot mark arrived from ${delivery.status} status (must be OUT_FOR_DELIVERY)`);
    }

    delivery.status = DeliveryStatus.ARRIVED;
    delivery.arrivedAt = new Date();
    delivery.updatedBy = userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined;

    await delivery.save();

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      branchId: delivery.branchId.toString(),
      action: 'DELIVERY_ARRIVED',
      entity: 'DeliveryRequest',
      entityId: id,
      metadata: { deliveryNumber: delivery.deliveryNumber },
    });

    return this.findOne(tenantId, id);
  }

  // ==========================================
  // COMPLETE DELIVERY (DELIVERED)
  // ==========================================

  async complete(
    tenantId: string,
    id: string,
    proofDto?: SubmitProofDto,
    userId?: string,
  ): Promise<DeliveryRequestDocument> {
    const delivery = await this.findOne(tenantId, id);

    if (
      delivery.status !== DeliveryStatus.ARRIVED &&
      delivery.status !== DeliveryStatus.OUT_FOR_DELIVERY &&
      delivery.status !== DeliveryStatus.ASSIGNED
    ) {
      throw new BadRequestException(`Cannot complete delivery in ${delivery.status} status`);
    }

    delivery.status = DeliveryStatus.DELIVERED;
    delivery.deliveredAt = new Date();

    if (proofDto) {
      delivery.proofOfDelivery = {
        recipientName: proofDto.recipientName,
        recipientPhone: proofDto.recipientPhone,
        deliveryNote: proofDto.deliveryNote,
        signatureUrl: proofDto.signatureUrl,
        photoUrl: proofDto.photoUrl,
        otpVerified: proofDto.otpVerified ?? false,
        otpVerifiedAt: proofDto.otpVerified ? new Date() : undefined,
      };
    }

    delivery.updatedBy = userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined;
    await delivery.save();

    // Mark order as DELIVERED
    await this.orderModel.updateOne(
      { _id: delivery.orderId, tenantId: new Types.ObjectId(tenantId) },
      {
        $set: {
          status: OrderStatus.DELIVERED,
          deliveredDate: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        },
      },
    ).exec();

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      branchId: delivery.branchId.toString(),
      action: 'DELIVERY_COMPLETED',
      entity: 'DeliveryRequest',
      entityId: id,
      metadata: { deliveryNumber: delivery.deliveryNumber },
    });

    try {
      const order = await this.orderModel.findById(delivery.orderId).exec();
      await this.notificationEventService.emit({
        tenantId,
        branchId: delivery.branchId.toString(),
        customerId: (delivery.customerId as any)?._id?.toString() || delivery.customerId?.toString(),
        orderId: (delivery.orderId as any)?._id?.toString() || delivery.orderId?.toString(),
        eventType: NotificationEventType.DELIVERY_COMPLETED,
        actorUserId: userId,
        variables: {
          deliveryNumber: delivery.deliveryNumber,
          orderNumber: order?.orderNumber || '',
        },
      });
    } catch (notifErr: any) {
      this.logger.warn(`Failed to emit DELIVERY_COMPLETED notification: ${notifErr.message}`);
    }

    return this.findOne(tenantId, id);
  }

  // ==========================================
  // RECORD PAYMENT COLLECTION
  // ==========================================

  async recordCollection(
    tenantId: string,
    id: string,
    dto: RecordCollectionDto,
    userId?: string,
  ): Promise<DeliveryRequestDocument> {
    const tId = new Types.ObjectId(tenantId);
    const delivery = await this.findOne(tenantId, id);

    const order = await this.orderModel.findOne({ _id: delivery.orderId, tenantId: tId }).exec();
    if (!order) {
      throw new NotFoundException('Associated order not found');
    }

    const collectAmount = Math.round(Number(dto.amount));
    if (collectAmount <= 0) {
      throw new BadRequestException('Collection amount must be greater than 0');
    }

    const currentDue = order.dueAmount || 0;
    if (collectAmount > currentDue) {
      throw new BadRequestException(
        `Collection amount (${collectAmount}) cannot exceed outstanding order balance (${currentDue})`,
      );
    }

    if (delivery.collectionPaymentId) {
      throw new BadRequestException('Payment collection has already been recorded for this delivery request');
    }

    // Generate atomic payment number
    const paymentNumber = await this.counterService.generatePaymentNumber(tenantId);

    const bId = (delivery.branchId as any)?._id || (Types.ObjectId.isValid(delivery.branchId?.toString()) ? new Types.ObjectId(delivery.branchId.toString()) : undefined);
    const cId = (delivery.customerId as any)?._id || (Types.ObjectId.isValid(delivery.customerId?.toString()) ? new Types.ObjectId(delivery.customerId.toString()) : undefined);

    const payment = new this.paymentModel({
      tenantId: tId,
      branchId: bId,
      orderId: order._id,
      customerId: cId,
      paymentNumber,
      amount: collectAmount,
      method: dto.paymentMethod,
      referenceNumber: dto.referenceNumber,
      notes: dto.notes || `Doorstep collection for delivery ${delivery.deliveryNumber}`,
      status: 'COMPLETED',
      receivedBy: userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined,
    });

    const savedPayment = await payment.save();

    // Update order financial balance
    const newPaid = (order.paidAmount || 0) + collectAmount;
    const newDue = Math.max(0, (order.grandTotal || 0) - newPaid);
    const newPaymentStatus = newDue === 0 ? PaymentStatus.PAID : PaymentStatus.PARTIAL;

    order.paidAmount = newPaid;
    order.dueAmount = newDue;
    order.paymentStatus = newPaymentStatus;
    await order.save();

    // Update delivery record
    delivery.collectionAmount = collectAmount;
    delivery.collectionPaymentMethod = dto.paymentMethod;
    delivery.collectionPaymentId = savedPayment._id;
    delivery.collectedBy = userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined;
    delivery.collectedAt = new Date();
    await delivery.save();

    const bIdStr = (delivery.branchId as any)?._id?.toString() || delivery.branchId?.toString();
    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      branchId: bIdStr,
      action: 'DELIVERY_COLLECTION_RECORDED',
      entity: 'DeliveryRequest',
      entityId: id,
      metadata: {
        paymentNumber,
        amount: collectAmount,
        paymentMethod: dto.paymentMethod,
        orderNumber: order.orderNumber,
      },
    });

    try {
      await this.notificationEventService.emit({
        tenantId,
        branchId: bIdStr,
        customerId: cId?.toString(),
        orderId: order._id.toString(),
        eventType: NotificationEventType.PAYMENT_RECEIVED,
        actorUserId: userId,
        variables: {
          paymentAmount: collectAmount,
          orderNumber: order.orderNumber,
          dueAmount: newDue,
          paymentMethod: dto.paymentMethod,
        },
      });
    } catch (notifErr: any) {
      this.logger.warn(`Failed to emit PAYMENT_RECEIVED notification: ${notifErr.message}`);
    }

    return this.findOne(tenantId, id);
  }

  // ==========================================
  // SUBMIT PROOF OF DELIVERY
  // ==========================================

  async submitProof(
    tenantId: string,
    id: string,
    dto: SubmitProofDto,
    userId?: string,
  ): Promise<DeliveryRequestDocument> {
    const delivery = await this.findOne(tenantId, id);

    delivery.proofOfDelivery = {
      recipientName: dto.recipientName,
      recipientPhone: dto.recipientPhone,
      deliveryNote: dto.deliveryNote,
      signatureUrl: dto.signatureUrl,
      photoUrl: dto.photoUrl,
      otpVerified: dto.otpVerified ?? false,
      otpVerifiedAt: dto.otpVerified ? new Date() : undefined,
    };

    delivery.updatedBy = userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined;
    await delivery.save();

    const bIdStr = (delivery.branchId as any)?._id?.toString() || delivery.branchId?.toString();
    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      branchId: bIdStr,
      action: 'DELIVERY_PROOF_UPDATED',
      entity: 'DeliveryRequest',
      entityId: id,
      metadata: { recipientName: dto.recipientName, otpVerified: dto.otpVerified },
    });

    return this.findOne(tenantId, id);
  }

  // ==========================================
  // FAIL DELIVERY
  // ==========================================

  async fail(tenantId: string, id: string, dto: FailDeliveryDto, userId?: string): Promise<DeliveryRequestDocument> {
    const delivery = await this.findOne(tenantId, id);

    if (delivery.status === DeliveryStatus.DELIVERED || delivery.status === DeliveryStatus.CANCELLED) {
      throw new BadRequestException(`Cannot fail delivery in ${delivery.status} status`);
    }

    const attemptNumber = (delivery.attemptCount || 0) + 1;
    const attemptedAt = new Date();

    delivery.status = DeliveryStatus.FAILED;
    delivery.attemptCount = attemptNumber;
    delivery.lastAttemptAt = attemptedAt;

    const noteText = dto.notes || dto.note;
    const assignedAgentObjId = (delivery.assignedAgentId as any)?._id || (Types.ObjectId.isValid(delivery.assignedAgentId?.toString()) ? delivery.assignedAgentId : undefined);

    delivery.attempts.push({
      attemptNumber,
      attemptedAt,
      agentId: assignedAgentObjId ? new Types.ObjectId(assignedAgentObjId.toString()) : undefined,
      reason: dto.reason,
      notes: noteText,
    });

    delivery.updatedBy = userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined;
    await delivery.save();

    const bIdStr = (delivery.branchId as any)?._id?.toString() || delivery.branchId?.toString();
    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      branchId: bIdStr,
      action: 'DELIVERY_FAILED',
      entity: 'DeliveryRequest',
      entityId: id,
      metadata: { reason: dto.reason, attemptNumber, notes: noteText },
    });

    try {
      const order = await this.orderModel.findById(delivery.orderId).exec();
      await this.notificationEventService.emit({
        tenantId,
        branchId: bIdStr,
        customerId: (delivery.customerId as any)?._id?.toString() || delivery.customerId?.toString(),
        orderId: (delivery.orderId as any)?._id?.toString() || delivery.orderId?.toString(),
        eventType: NotificationEventType.DELIVERY_FAILED,
        actorUserId: userId,
        variables: {
          deliveryNumber: delivery.deliveryNumber,
          orderNumber: order?.orderNumber || '',
          failureReason: dto.reason || noteText || 'Customer unavailable',
        },
      });
    } catch (notifErr: any) {
      this.logger.warn(`Failed to emit DELIVERY_FAILED notification: ${notifErr.message}`);
    }

    return this.findOne(tenantId, id);
  }

  // ==========================================
  // RESCHEDULE DELIVERY
  // ==========================================

  async reschedule(tenantId: string, id: string, dto: RescheduleDeliveryDto, userId?: string): Promise<DeliveryRequestDocument> {
    const delivery = await this.findOne(tenantId, id);

    if (delivery.status === DeliveryStatus.DELIVERED || delivery.status === DeliveryStatus.CANCELLED) {
      throw new BadRequestException(`Cannot reschedule delivery in ${delivery.status} status`);
    }

    const newDate = dto.newDate || dto.scheduledDate;
    const newTimeFrom = dto.newTimeFrom || dto.scheduledTimeFrom;
    const newTimeTo = dto.newTimeTo || dto.scheduledTimeTo;
    const reasonText = dto.reason || dto.notes;

    if (!newDate) {
      throw new BadRequestException('New scheduled date is required');
    }

    delivery.rescheduleHistory.push({
      previousDate: delivery.scheduledDate,
      previousTimeFrom: delivery.scheduledTimeFrom,
      previousTimeTo: delivery.scheduledTimeTo,
      newDate,
      newTimeFrom,
      newTimeTo,
      reason: reasonText,
      changedBy: userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined,
      changedAt: new Date(),
    });

    delivery.scheduledDate = newDate;
    if (newTimeFrom !== undefined) delivery.scheduledTimeFrom = newTimeFrom;
    if (newTimeTo !== undefined) delivery.scheduledTimeTo = newTimeTo;
    delivery.status = DeliveryStatus.SCHEDULED;
    delivery.updatedBy = userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined;

    await delivery.save();

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      branchId: delivery.branchId.toString(),
      action: 'DELIVERY_RESCHEDULED',
      entity: 'DeliveryRequest',
      entityId: id,
      metadata: {
        previousDate: delivery.scheduledDate,
        newDate,
        reason: reasonText,
      },
    });

    return this.findOne(tenantId, id);
  }

  // ==========================================
  // CANCEL DELIVERY
  // ==========================================

  async cancel(tenantId: string, id: string, dto: CancelDeliveryDto, userId?: string): Promise<DeliveryRequestDocument> {
    const delivery = await this.findOne(tenantId, id);

    if (delivery.status === DeliveryStatus.DELIVERED) {
      throw new BadRequestException('Cannot cancel delivery that is already completed (DELIVERED)');
    }

    const cancelReason = dto.reason || dto.notes;
    delivery.status = DeliveryStatus.CANCELLED;
    delivery.cancellationReason = cancelReason;
    if (cancelReason) {
      delivery.internalNotes = delivery.internalNotes ? `${delivery.internalNotes}\nCancellation: ${cancelReason}` : `Cancellation: ${cancelReason}`;
    }
    delivery.updatedBy = userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined;

    await delivery.save();

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      branchId: delivery.branchId.toString(),
      action: 'DELIVERY_CANCELLED',
      entity: 'DeliveryRequest',
      entityId: id,
      metadata: { reason: cancelReason },
    });

    return this.findOne(tenantId, id);
  }
}
