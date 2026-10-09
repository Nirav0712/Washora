import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../../schemas/order.schema';
import { Customer, CustomerDocument } from '../../schemas/customer.schema';
import { Branch, BranchDocument } from '../../schemas/branch.schema';
import { Garment, GarmentDocument } from '../../schemas/garment.schema';
import { Payment, PaymentDocument } from '../../schemas/payment.schema';
import { TenantSettings, TenantSettingsDocument } from '../../schemas/tenant-settings.schema';
import { ProcessingJob, ProcessingJobDocument } from '../../schemas/processing-job.schema';
import { ProcessingEvent, ProcessingEventDocument } from '../../schemas/processing-event.schema';
import { PricingCalculatorService, ResolvedItemPrice } from './pricing-calculator.service';
import { CounterService } from '../../common/services/counter.service';
import { AuditService } from '../audit/audit.service';
import { NotificationEventService } from '../notifications/notification-event.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto, UpdateOrderStatusDto } from './dto/update-order.dto';
import {
  OrderStatus,
  PaymentStatus,
  PricingTier,
  GarmentProcessingStatus,
  ProcessingJobStatus,
  ProcessingPriority,
  ProcessingAction,
  RoleType,
  NotificationEventType,
} from '@washora/shared';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    @InjectModel(Garment.name) private garmentModel: Model<GarmentDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(TenantSettings.name) private settingsModel: Model<TenantSettingsDocument>,
    @InjectModel(ProcessingJob.name) private jobModel: Model<ProcessingJobDocument>,
    @InjectModel(ProcessingEvent.name) private eventModel: Model<ProcessingEventDocument>,
    private pricingCalculator: PricingCalculatorService,
    private counterService: CounterService,
    private auditService: AuditService,
    private notificationEventService: NotificationEventService,
  ) {}

  async findAll(
    tenantId: string | Types.ObjectId,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      orderNumber?: string;
      customerId?: string;
      phone?: string;
      status?: string;
      paymentStatus?: string;
      branchId?: string;
      pricingTier?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {},
    userBranchIds: string[] = [],
  ) {
    const tId = new Types.ObjectId(tenantId.toString());
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      tenantId: tId,
      isDeleted: false,
    };

    // Branch scoping
    if (userBranchIds && userBranchIds.length > 0) {
      filter.branchId = { $in: userBranchIds.map((id) => new Types.ObjectId(id)) };
    }
    if (query.branchId && Types.ObjectId.isValid(query.branchId)) {
      filter.branchId = new Types.ObjectId(query.branchId);
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.paymentStatus) {
      filter.paymentStatus = query.paymentStatus;
    }

    if (query.pricingTier) {
      filter.pricingTier = query.pricingTier;
    }

    if (query.customerId && Types.ObjectId.isValid(query.customerId)) {
      filter.customerId = new Types.ObjectId(query.customerId);
    }

    if (query.orderNumber) {
      filter.orderNumber = { $regex: query.orderNumber.trim(), $options: 'i' };
    }

    if (query.phone) {
      filter['customerSnapshot.phone'] = { $regex: query.phone.trim(), $options: 'i' };
    }

    if (query.search) {
      const s = query.search.trim();
      filter.$or = [
        { orderNumber: { $regex: s, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: s, $options: 'i' } },
        { 'customerSnapshot.phone': { $regex: s, $options: 'i' } },
      ];
    }

    if (query.dateFrom || query.dateTo) {
      filter.createdAt = {};
      if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
      if (query.dateTo) {
        const toDate = new Date(query.dateTo);
        toDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDate;
      }
    }

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .populate('branchId', 'name code city')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments(filter),
    ]);

    return {
      items: orders.map((o) => {
        const obj = o.toObject();
        return {
          ...obj,
          id: o._id.toString(),
          branchName: (o.branchId as any)?.name || 'Main Branch',
          branch: o.branchId,
          customer: {
            id: o.customerId.toString(),
            name: o.customerSnapshot?.name,
            phone: o.customerSnapshot?.phone,
            email: o.customerSnapshot?.email,
            address: o.customerSnapshot?.address,
          },
        };
      }),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(tenantId: string | Types.ObjectId, id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid order ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const order = await this.orderModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: tId, isDeleted: false })
      .populate('branchId', 'name code address city phone email taxRate')
      .populate('garmentIds')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    const payments = await this.paymentModel
      .find({ tenantId: tId, orderId: order._id })
      .sort({ createdAt: -1 })
      .exec();

    const obj = order.toObject();
    return {
      ...obj,
      id: order._id.toString(),
      branchName: (order.branchId as any)?.name || 'Main Branch',
      branch: order.branchId,
      customer: {
        id: order.customerId.toString(),
        name: order.customerSnapshot?.name,
        phone: order.customerSnapshot?.phone,
        email: order.customerSnapshot?.email,
        address: order.customerSnapshot?.address,
      },
      payments: payments.map((p) => ({
        ...p.toObject(),
        id: p._id.toString(),
      })),
    };
  }

  async create(
    tenantId: string | Types.ObjectId,
    actorUserId: string | Types.ObjectId,
    actorUserName = 'Staff',
    dto: CreateOrderDto,
  ) {
    const tId = new Types.ObjectId(tenantId.toString());
    const uId = new Types.ObjectId(actorUserId.toString());

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item.');
    }

    // 1. Verify Customer belongs to this tenant
    if (!Types.ObjectId.isValid(dto.customerId)) {
      throw new BadRequestException('Invalid customer ID.');
    }
    const customer = await this.customerModel
      .findOne({ _id: new Types.ObjectId(dto.customerId), tenantId: tId, isDeleted: false })
      .exec();

    if (!customer) {
      throw new NotFoundException('Customer not found in your organization.');
    }

    // 2. Verify Branch belongs to this tenant
    if (!Types.ObjectId.isValid(dto.branchId)) {
      throw new BadRequestException('Invalid branch ID.');
    }
    const branch = await this.branchModel
      .findOne({ _id: new Types.ObjectId(dto.branchId), tenantId: tId, isDeleted: false })
      .exec();

    if (!branch) {
      throw new NotFoundException('Branch not found in your organization.');
    }

    // 3. Load Tenant Settings for Invoice prefix and Tax
    const settings = await this.settingsModel.findOne({ tenantId: tId }).exec();
    const invoicePrefix = settings?.invoicePrefix || 'WS-';
    const invoiceNumberStart = settings?.invoiceNumberStart || 1000;
    const defaultTaxRate = branch.taxRate ?? settings?.defaultTaxRate ?? 5.0;

    // 4. Server-Authoritative Item Price Resolution
    const resolvedItems: ResolvedItemPrice[] = [];
    const defaultTier = dto.pricingTier || PricingTier.REGULAR;

    for (const itemInput of dto.items) {
      const itemTier = itemInput.pricingTier || defaultTier;
      const resolved = await this.pricingCalculator.resolveProductPrice(
        tId,
        branch._id as Types.ObjectId,
        itemInput.productId,
        itemInput.serviceId,
        itemTier,
      );

      const qty = Math.max(1, Math.floor(itemInput.quantity));
      const lineSubtotal = Math.round(qty * resolved.unitPrice * 100) / 100;
      const taxRate = resolved.taxRate;
      const taxAmount = Math.round(((lineSubtotal * taxRate) / 100) * 100) / 100;
      const lineTotal = Math.round((lineSubtotal + taxAmount) * 100) / 100;

      resolvedItems.push({
        productId: resolved.product._id as Types.ObjectId,
        categoryId: ((resolved.product.categoryId as any)?._id || resolved.product.categoryId) as Types.ObjectId,
        serviceId: itemInput.serviceId ? new Types.ObjectId(itemInput.serviceId) : undefined,
        productNameSnapshot: resolved.productNameSnapshot,
        categoryNameSnapshot: resolved.categoryNameSnapshot,
        serviceNameSnapshot: resolved.serviceNameSnapshot,
        unit: resolved.unit,
        pricingTier: itemTier,
        quantity: qty,
        unitPrice: resolved.unitPrice,
        lineSubtotal,
        taxRate,
        taxAmount,
        discountAmount: 0,
        lineTotal,
        notes: itemInput.notes,
        garmentColor: itemInput.garmentColor,
        garmentBrand: itemInput.garmentBrand,
        defectsNoted: itemInput.defectsNoted || [],
      });
    }

    // 5. Initial Payment handling
    const initialPaid = dto.payment && dto.payment.amount ? Math.max(0, dto.payment.amount) : 0;

    // 6. Server-Authoritative Totals Calculation
    const totals = this.pricingCalculator.calculateOrderTotals(
      resolvedItems,
      dto.discount,
      defaultTaxRate,
      initialPaid,
    );

    // Prevent overpayment beyond grandTotal if negative due
    if (initialPaid > totals.grandTotal && totals.grandTotal > 0) {
      throw new BadRequestException(
        `Initial payment of ₹${initialPaid} cannot exceed grand total of ₹${totals.grandTotal}.`,
      );
    }

    // 7. Atomic Order Number Generation
    const orderNumber = await this.counterService.generateOrderNumber(
      tId,
      invoicePrefix,
      invoiceNumberStart,
    );

    // 8. Create Order Document
    const order = new this.orderModel({
      tenantId: tId,
      branchId: branch._id,
      orderNumber,
      customerId: customer._id,
      customerSnapshot: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.addresses?.[0]?.addressLine1 || '',
      },
      status: OrderStatus.RECEIVED,
      items: resolvedItems,
      itemCount: totals.itemCount,
      subtotal: totals.subtotal,
      discountType: totals.discountType,
      discountValue: totals.discountValue,
      discountAmount: totals.discountAmount,
      taxableAmount: totals.taxableAmount,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      grandTotal: totals.grandTotal,
      paidAmount: totals.paidAmount,
      dueAmount: totals.dueAmount,
      paymentStatus: totals.paymentStatus,
      paymentMethod: dto.payment?.method || undefined,
      pricingTier: defaultTier,
      notes: dto.notes,
      internalNotes: dto.internalNotes,
      pickupRequired: dto.pickupRequired ?? false,
      deliveryRequired: dto.deliveryRequired ?? false,
      expectedReadyAt: dto.expectedReadyAt ? new Date(dto.expectedReadyAt) : undefined,
      timeline: [
        {
          status: OrderStatus.RECEIVED,
          label: 'Order Placed at POS Counter',
          timestamp: new Date(),
          updatedBy: actorUserName,
          note: dto.notes || 'Order created and tagged',
          isCompleted: true,
        },
      ],
      createdBy: uId,
      updatedBy: uId,
    });

    await order.save();

    // 9. Create Garment Records
    const createdGarmentIds: Types.ObjectId[] = [];

    for (let i = 0; i < dto.items.length; i++) {
      const itemInput = dto.items[i];
      const resolved = resolvedItems[i];
      const customGarments = itemInput.garments || [];

      for (let g = 0; g < resolved.quantity; g++) {
        const garmentMeta = customGarments[g] || {};
        const garmentNumber = await this.counterService.generateGarmentNumber(tId);

        const garment = new this.garmentModel({
          tenantId: tId,
          branchId: branch._id,
          orderId: order._id,
          orderItemId: (order.items[i] as any)?._id?.toString(),
          garmentNumber,
          productId: resolved.productId,
          productName: resolved.productNameSnapshot,
          serviceId: resolved.serviceId,
          serviceName: resolved.serviceNameSnapshot,
          barcode: garmentNumber,
          color: garmentMeta.color || itemInput.garmentColor,
          brand: garmentMeta.brand || itemInput.garmentBrand,
          condition: garmentMeta.condition || 'GOOD',
          stainsNoted: garmentMeta.stainsNoted || itemInput.defectsNoted || [],
          damagesNoted: garmentMeta.damagesNoted || [],
          specialInstructions: garmentMeta.specialInstructions || itemInput.notes,
          processingStatus: GarmentProcessingStatus.RECEIVED,
        });

        await garment.save();
        createdGarmentIds.push(garment._id as Types.ObjectId);

        // Determine job priority based on order pricing tier
        let jobPriority = ProcessingPriority.NORMAL;
        if (defaultTier === PricingTier.EXPRESS) {
          jobPriority = ProcessingPriority.HIGH;
        } else if (defaultTier === PricingTier.SAME_DAY || defaultTier === PricingTier.URGENT) {
          jobPriority = ProcessingPriority.URGENT;
        }

        // Automatically create Processing Job for each garment
        const job = new this.jobModel({
          tenantId: tId,
          branchId: branch._id,
          orderId: order._id,
          garmentId: garment._id,
          stageCode: 'RECEIVED',
          stageName: 'Received / Intake',
          status: ProcessingJobStatus.QUEUED,
          priority: jobPriority,
          expectedCompletionAt: dto.expectedReadyAt ? new Date(dto.expectedReadyAt) : undefined,
          notes: garmentMeta.specialInstructions || itemInput.notes,
          createdBy: uId,
          updatedBy: uId,
        });
        await job.save();

        // Create initial processing event
        const event = new this.eventModel({
          tenantId: tId,
          branchId: branch._id,
          processingJobId: job._id,
          orderId: order._id,
          garmentId: garment._id,
          toStage: 'RECEIVED',
          action: ProcessingAction.STAGE_STARTED,
          actorUserId: uId,
          actorName: actorUserName,
          notes: 'Garment intake registered at POS',
          timestamp: new Date(),
        });
        await event.save();
      }
    }

    // Attach garments to order
    order.garmentIds = createdGarmentIds;
    await order.save();

    // 10. Record Initial Payment Document if paid > 0
    if (initialPaid > 0 && dto.payment) {
      const paymentNumber = await this.counterService.generatePaymentNumber(tId);
      const payment = new this.paymentModel({
        tenantId: tId,
        branchId: branch._id,
        orderId: order._id,
        customerId: customer._id,
        paymentNumber,
        amount: initialPaid,
        method: dto.payment.method,
        status: 'COMPLETED',
        referenceNumber: dto.payment.referenceNumber,
        notes: dto.payment.notes || 'Initial POS payment',
        receivedBy: uId,
      });
      await payment.save();

      // Add payment timeline event
      order.timeline.push({
        status: OrderStatus.RECEIVED,
        label: `Payment Received: ₹${initialPaid} via ${dto.payment.method}`,
        timestamp: new Date(),
        updatedBy: actorUserName,
        note: `Ref: ${dto.payment.referenceNumber || 'Counter'}`,
        isCompleted: true,
      });
      await order.save();
    }

    // 11. Update Customer Aggregate Financials
    await this.updateCustomerStats(tId, customer._id as Types.ObjectId);

    // 12. Audit Log
    await this.auditService.log({
      tenantId: tId,
      branchId: branch._id,
      actorUserId: uId,
      action: 'ORDER_CREATED',
      entity: 'Order',
      entityId: order._id.toString(),
      metadata: {
        orderNumber: order.orderNumber,
        grandTotal: order.grandTotal,
        itemCount: order.itemCount,
        paidAmount: order.paidAmount,
        customerPhone: customer.phone,
      },
    });

    // 13. Trigger Order Created Notification Event
    try {
      await this.notificationEventService.emit({
        tenantId: tId,
        branchId: branch._id,
        customerId: customer._id,
        orderId: order._id,
        eventType: NotificationEventType.ORDER_CREATED,
        actorUserId: uId,
        variables: {
          customerName: customer.name,
          customerPhone: customer.phone,
          orderNumber: order.orderNumber,
          totalAmount: order.grandTotal,
          paidAmount: order.paidAmount,
          dueAmount: order.dueAmount,
          shopName: (settings as any)?.companyName || 'Washora Laundry',
          branchName: branch.name,
        },
      });
    } catch (notifErr: any) {
      this.logger.warn(`Failed to emit ORDER_CREATED notification: ${notifErr.message}`);
    }

    return this.findById(tId, order._id.toString());
  }

  async updateStatus(
    tenantId: string | Types.ObjectId,
    id: string,
    actorUserId: string | Types.ObjectId,
    actorUserName = 'Staff',
    dto: UpdateOrderStatusDto,
  ) {
    const tId = new Types.ObjectId(tenantId.toString());
    const uId = new Types.ObjectId(actorUserId.toString());
    const order = await this.orderModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: tId, isDeleted: false })
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    // Validate lifecycle state transition
    this.pricingCalculator.validateStatusTransition(order.status, dto.status);

    const prevStatus = order.status;
    order.status = dto.status;
    order.updatedBy = uId;

    if (dto.status === OrderStatus.COMPLETED || dto.status === OrderStatus.DELIVERED) {
      order.completedAt = new Date();
    }

    order.timeline.push({
      status: dto.status,
      label: `Status advanced to ${dto.status}`,
      timestamp: new Date(),
      updatedBy: actorUserName,
      note: dto.note || `Transitioned from ${prevStatus}`,
      isCompleted: true,
    });

    await order.save();

    // Sync garments status if relevant
    let garmentStatus: GarmentProcessingStatus | null = null;
    if (dto.status === OrderStatus.PROCESSING) garmentStatus = GarmentProcessingStatus.PROCESSING;
    if (dto.status === OrderStatus.READY) garmentStatus = GarmentProcessingStatus.READY;
    if (dto.status === OrderStatus.DELIVERED || dto.status === OrderStatus.COMPLETED) {
      garmentStatus = GarmentProcessingStatus.DELIVERED;
    }

    if (garmentStatus) {
      await this.garmentModel.updateMany(
        { orderId: order._id, tenantId: tId },
        { $set: { processingStatus: garmentStatus } },
      ).exec();
    }

    await this.auditService.log({
      tenantId: tId,
      branchId: order.branchId,
      actorUserId: uId,
      action: 'ORDER_STATUS_CHANGED',
      entity: 'Order',
      entityId: order._id.toString(),
      metadata: { from: prevStatus, to: dto.status, note: dto.note },
    });

    // Trigger Notification Events
    try {
      if (dto.status === OrderStatus.READY) {
        await this.notificationEventService.emit({
          tenantId: tId,
          branchId: order.branchId,
          customerId: order.customerId,
          orderId: order._id,
          eventType: NotificationEventType.ORDER_READY,
          actorUserId: uId,
          variables: {
            orderNumber: order.orderNumber,
            totalAmount: order.grandTotal,
            dueAmount: order.dueAmount,
            paidAmount: order.paidAmount,
          },
        });
      } else if (dto.status === OrderStatus.PROCESSING) {
        await this.notificationEventService.emit({
          tenantId: tId,
          branchId: order.branchId,
          customerId: order.customerId,
          orderId: order._id,
          eventType: NotificationEventType.PROCESSING_STARTED,
          actorUserId: uId,
          variables: {
            orderNumber: order.orderNumber,
          },
        });
      } else if (dto.status === OrderStatus.CANCELLED) {
        await this.notificationEventService.emit({
          tenantId: tId,
          branchId: order.branchId,
          customerId: order.customerId,
          orderId: order._id,
          eventType: NotificationEventType.ORDER_CANCELLED,
          actorUserId: uId,
          variables: {
            orderNumber: order.orderNumber,
            failureReason: dto.note || 'Cancelled by staff',
          },
        });
      }
    } catch (notifErr: any) {
      this.logger.warn(`Failed to emit status notification: ${notifErr.message}`);
    }

    return this.findById(tId, order._id.toString());
  }

  async cancelOrder(
    tenantId: string | Types.ObjectId,
    id: string,
    actorUserId: string | Types.ObjectId,
    actorUserName = 'Staff',
    reason: string,
  ) {
    const tId = new Types.ObjectId(tenantId.toString());
    const uId = new Types.ObjectId(actorUserId.toString());
    const order = await this.orderModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: tId, isDeleted: false })
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('Completed orders cannot be cancelled.');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled.');
    }

    order.status = OrderStatus.CANCELLED;
    order.updatedBy = uId;

    order.timeline.push({
      status: OrderStatus.CANCELLED,
      label: 'Order Cancelled',
      timestamp: new Date(),
      updatedBy: actorUserName,
      note: reason || 'Cancelled by staff',
      isCompleted: true,
    });

    await order.save();

    // Recalculate customer metrics
    await this.updateCustomerStats(tId, order.customerId as Types.ObjectId);

    await this.auditService.log({
      tenantId: tId,
      branchId: order.branchId,
      actorUserId: uId,
      action: 'ORDER_CANCELLED',
      entity: 'Order',
      entityId: order._id.toString(),
      metadata: { reason },
    });

    // Trigger Cancelled Notification Event
    try {
      await this.notificationEventService.emit({
        tenantId: tId,
        branchId: order.branchId,
        customerId: order.customerId,
        orderId: order._id,
        eventType: NotificationEventType.ORDER_CANCELLED,
        actorUserId: uId,
        variables: {
          orderNumber: order.orderNumber,
          failureReason: reason || 'Cancelled by staff',
        },
      });
    } catch (notifErr: any) {
      this.logger.warn(`Failed to emit ORDER_CANCELLED notification: ${notifErr.message}`);
    }

    return this.findById(tId, order._id.toString());
  }

  async update(
    tenantId: string | Types.ObjectId,
    id: string,
    actorUserId: string | Types.ObjectId,
    dto: UpdateOrderDto,
  ) {
    const tId = new Types.ObjectId(tenantId.toString());
    const uId = new Types.ObjectId(actorUserId.toString());
    const order = await this.orderModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: tId, isDeleted: false })
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    if (dto.notes !== undefined) order.notes = dto.notes;
    if (dto.internalNotes !== undefined) order.internalNotes = dto.internalNotes;
    if (dto.expectedReadyAt !== undefined) {
      order.expectedReadyAt = dto.expectedReadyAt ? new Date(dto.expectedReadyAt) : undefined;
    }
    order.updatedBy = uId;
    await order.save();

    await this.auditService.log({
      tenantId: tId,
      branchId: order.branchId,
      actorUserId: uId,
      action: 'ORDER_UPDATED',
      entity: 'Order',
      entityId: order._id.toString(),
      metadata: { notes: dto.notes, expectedReadyAt: dto.expectedReadyAt },
    });

    return this.findById(tId, order._id.toString());
  }

  async delete(
    tenantId: string | Types.ObjectId,
    id: string,
    actorUserId: string | Types.ObjectId,
  ) {
    const tId = new Types.ObjectId(tenantId.toString());
    const uId = new Types.ObjectId(actorUserId.toString());
    const order = await this.orderModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: tId, isDeleted: false })
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    order.isDeleted = true;
    order.updatedBy = uId;
    await order.save();

    await this.updateCustomerStats(tId, order.customerId as Types.ObjectId);

    await this.auditService.log({
      tenantId: tId,
      branchId: order.branchId,
      actorUserId: uId,
      action: 'ORDER_DELETED',
      entity: 'Order',
      entityId: order._id.toString(),
      metadata: { orderNumber: order.orderNumber },
    });

    return { success: true, message: 'Order deleted successfully' };
  }

  async getTimeline(tenantId: string | Types.ObjectId, id: string) {
    const order = await this.findById(tenantId, id);
    return order.timeline || [];
  }

  async getInvoiceData(tenantId: string | Types.ObjectId, id: string) {
    const order = await this.findById(tenantId, id);
    const settings = await this.settingsModel.findOne({ tenantId: new Types.ObjectId(tenantId.toString()) }).exec();

    return {
      order,
      invoiceNumber: order.orderNumber,
      invoiceDate: order.createdAt,
      currency: settings?.currency || 'INR',
      currencySymbol: settings?.currencySymbol || '₹',
      shopSettings: {
        receiptSettings: settings?.receiptSettings,
        branding: settings?.branding,
      },
    };
  }

  private async updateCustomerStats(tenantId: Types.ObjectId, customerId: Types.ObjectId) {
    const orders = await this.orderModel.find({
      tenantId,
      customerId,
      isDeleted: false,
      status: { $ne: OrderStatus.CANCELLED },
    }).exec();

    let totalOrders = orders.length;
    let totalSpent = 0;
    let pendingBalance = 0;

    for (const ord of orders) {
      totalSpent += ord.grandTotal || ord.subtotal || 0;
      pendingBalance += ord.dueAmount || 0;
    }

    await this.customerModel.updateOne(
      { _id: customerId, tenantId },
      {
        $set: {
          totalOrders,
          totalSpent: Math.round(totalSpent * 100) / 100,
          pendingBalance: Math.max(0, Math.round(pendingBalance * 100) / 100),
        },
      },
    ).exec();
  }
}
