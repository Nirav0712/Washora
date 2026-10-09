import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { Order, OrderDocument } from '../../schemas/order.schema';
import { Tenant, TenantDocument } from '../../schemas/tenant.schema';
import { Branch, BranchDocument } from '../../schemas/branch.schema';
import { PickupRequest, PickupRequestDocument } from '../../schemas/pickup-request.schema';
import { DeliveryRequest, DeliveryRequestDocument } from '../../schemas/delivery-request.schema';
import { AuditService } from '../audit/audit.service';
import { OrderStatus, CustomerOrderTracking, CustomerOrderTrackingStep } from '@washora/shared';

@Injectable()
export class CustomerTrackingService {
  private readonly logger = new Logger(CustomerTrackingService.name);

  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    @InjectModel(Tenant.name)
    private tenantModel: Model<TenantDocument>,
    @InjectModel(Branch.name)
    private branchModel: Model<BranchDocument>,
    @InjectModel(PickupRequest.name)
    private pickupModel: Model<PickupRequestDocument>,
    @InjectModel(DeliveryRequest.name)
    private deliveryModel: Model<DeliveryRequestDocument>,
    private auditService: AuditService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token.trim()).digest('hex');
  }

  async generateToken(tenantId: string, orderId: string): Promise<{ token: string; expiresAt: Date }> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days

    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(orderId),
      tenantId: new Types.ObjectId(tenantId),
      isDeleted: { $ne: true },
    }).exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.trackingToken = rawToken;
    order.trackingTokenHash = tokenHash;
    order.trackingTokenCreatedAt = new Date();
    order.trackingTokenExpiresAt = expiresAt;
    order.trackingTokenRevokedAt = undefined;
    await order.save();

    await this.auditService.log({
      tenantId,
      action: 'TRACKING_TOKEN_CREATED',
      entity: 'Order',
      entityId: order._id.toString(),
      metadata: { orderNumber: order.orderNumber, expiresAt },
    });

    return { token: rawToken, expiresAt };
  }

  async regenerateToken(tenantId: string, orderId: string): Promise<{ token: string; expiresAt: Date }> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(orderId),
      tenantId: new Types.ObjectId(tenantId),
      isDeleted: { $ne: true },
    }).exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.trackingToken = rawToken;
    order.trackingTokenHash = tokenHash;
    order.trackingTokenCreatedAt = new Date();
    order.trackingTokenExpiresAt = expiresAt;
    order.trackingTokenRevokedAt = undefined;
    await order.save();

    await this.auditService.log({
      tenantId,
      action: 'TRACKING_TOKEN_REGENERATED',
      entity: 'Order',
      entityId: order._id.toString(),
      metadata: { orderNumber: order.orderNumber, expiresAt },
    });

    return { token: rawToken, expiresAt };
  }

  async revokeToken(tenantId: string, orderId: string): Promise<{ success: boolean; message: string }> {
    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(orderId),
      tenantId: new Types.ObjectId(tenantId),
      isDeleted: { $ne: true },
    }).exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.trackingToken = undefined;
    order.trackingTokenHash = undefined;
    order.trackingTokenRevokedAt = new Date();
    await order.save();

    await this.auditService.log({
      tenantId,
      action: 'TRACKING_TOKEN_REVOKED',
      entity: 'Order',
      entityId: order._id.toString(),
      metadata: { orderNumber: order.orderNumber },
    });

    return { success: true, message: 'Tracking token revoked successfully' };
  }

  async getTrackingByToken(token: string): Promise<CustomerOrderTracking> {
    if (!token || token.trim().length < 8) {
      throw new NotFoundException('Invalid or expired tracking link');
    }

    const tokenHash = this.hashToken(token);

    const order = await this.orderModel.findOne({
      $or: [
        { trackingTokenHash: tokenHash },
        { trackingToken: token.trim() },
      ],
      isDeleted: { $ne: true },
    })
      .populate('tenantId', 'name companyName logo phone email')
      .populate('branchId', 'name phone address')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found or tracking link invalid');
    }

    if (order.trackingTokenRevokedAt) {
      throw new NotFoundException('This tracking link has been revoked');
    }

    if (order.trackingTokenExpiresAt && order.trackingTokenExpiresAt < new Date()) {
      throw new NotFoundException('This tracking link has expired');
    }

    const tenant = order.tenantId as any;
    const branch = order.branchId as any;

    // Fetch related pickup and delivery if any
    const [pickup, delivery] = await Promise.all([
      this.pickupModel.findOne({ orderId: order._id, tenantId: order.tenantId }).exec(),
      this.deliveryModel.findOne({ orderId: order._id, tenantId: order.tenantId }).exec(),
    ]);

    // Construct customer-friendly tracking steps
    const statusOrder: OrderStatus[] = [
      OrderStatus.RECEIVED,
      OrderStatus.PROCESSING,
      OrderStatus.QC,
      OrderStatus.READY,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
    ];

    const currentStatus = order.status || OrderStatus.RECEIVED;
    const isCancelled = currentStatus === OrderStatus.CANCELLED;
    const isCompleted = currentStatus === OrderStatus.DELIVERED || currentStatus === OrderStatus.COMPLETED;

    let currentIndex = statusOrder.indexOf(currentStatus);
    if (currentIndex === -1) {
      if (currentStatus === OrderStatus.SORTING || currentStatus === OrderStatus.TAGGED) currentIndex = 1;
      else if (currentStatus === OrderStatus.PACKED) currentIndex = 3;
      else if (isCompleted) currentIndex = 5;
      else currentIndex = 0;
    }

    const steps: CustomerOrderTrackingStep[] = [
      {
        key: 'ORDER_PLACED',
        label: 'Order Placed',
        description: 'Order registered & confirmed at store',
        timestamp: (order as any).createdAt?.toISOString(),
        isCompleted: true,
        isCurrent: currentIndex === 0 && !isCancelled,
      },
      {
        key: 'PROCESSING',
        label: 'In Care & Processing',
        description: 'Washing, dry cleaning and garment care in progress',
        isCompleted: currentIndex >= 1 || isCompleted,
        isCurrent: (currentIndex === 1 || currentIndex === 2) && !isCancelled,
      },
      {
        key: 'QUALITY_CHECK',
        label: 'Quality Inspection',
        description: 'Garments inspected and packaging completed',
        isCompleted: currentIndex >= 3 || isCompleted,
        isCurrent: currentIndex === 3 && !isCancelled,
      },
      {
        key: 'READY',
        label: 'Ready for Pickup / Dispatch',
        description: 'Garments ready at branch counter or awaiting dispatch',
        isCompleted: currentIndex >= 3 || isCompleted,
        isCurrent: currentIndex === 3 && !isCancelled,
      },
      {
        key: 'OUT_FOR_DELIVERY',
        label: 'Out for Delivery',
        description: 'Assigned driver is en route with your fresh laundry',
        isCompleted: currentIndex >= 4 || isCompleted,
        isCurrent: currentIndex === 4 && !isCancelled,
      },
      {
        key: 'DELIVERED',
        label: 'Delivered & Completed',
        description: 'Order delivered to customer. Thank you for choosing us!',
        isCompleted: isCompleted,
        isCurrent: isCompleted && !isCancelled,
      },
    ];

    if (isCancelled) {
      steps.push({
        key: 'CANCELLED',
        label: 'Order Cancelled',
        description: 'This order was cancelled.',
        isCompleted: true,
        isCurrent: true,
      });
    }

    // Sanitize garments / items - only customer visible fields
    const garments = (order.items || []).map((item: any) => ({
      name: item.productNameSnapshot || item.name || 'Garment Item',
      quantity: item.quantity || 1,
      serviceName: item.serviceNameSnapshot || 'Standard Care',
      status: currentStatus,
      color: item.garmentColor || item.color,
      brand: item.garmentBrand || item.brand,
    }));

    return {
      orderNumber: order.orderNumber,
      shopName: tenant?.name || 'Washora Laundry',
      tenantName: tenant?.name || 'Washora Laundry',
      branchName: branch?.name || 'Main Branch',
      orderDate: ((order as any).createdAt || new Date()).toISOString(),
      placedAt: ((order as any).createdAt || new Date()).toISOString(),
      expectedReadyAt: order.expectedReadyAt?.toISOString(),
      overallStatus: currentStatus,
      currentStep: isCancelled ? 'CANCELLED' : steps[Math.min(currentIndex, steps.length - 1)].key,
      steps,
      itemCount: garments.reduce((acc, g) => acc + g.quantity, 0),
      garments,
      itemsSummary: {
        itemCount: garments.reduce((acc, g) => acc + g.quantity, 0),
        items: garments,
      },
      paymentSummary: {
        total: order.grandTotal || 0,
        paid: order.paidAmount || 0,
        due: order.dueAmount || 0,
        status: order.paymentStatus || 'UNPAID',
        grandTotal: order.grandTotal || 0,
        paidAmount: order.paidAmount || 0,
        dueAmount: order.dueAmount || 0,
        paymentStatus: order.paymentStatus || 'UNPAID',
      },
      financialSummary: {
        grandTotal: order.grandTotal || 0,
        paidAmount: order.paidAmount || 0,
        dueAmount: order.dueAmount || 0,
        paymentStatus: order.paymentStatus || 'UNPAID',
        total: order.grandTotal || 0,
        paid: order.paidAmount || 0,
        due: order.dueAmount || 0,
        status: order.paymentStatus || 'UNPAID',
      },
      pickup: pickup ? {
        pickupNumber: pickup.pickupNumber,
        scheduledDate: pickup.scheduledDate,
        timeSlot: pickup.scheduledTimeFrom ? `${pickup.scheduledTimeFrom} - ${pickup.scheduledTimeTo}` : undefined,
        status: pickup.status,
      } : undefined,
      delivery: delivery ? {
        deliveryNumber: delivery.deliveryNumber,
        scheduledDate: delivery.scheduledDate,
        timeSlot: delivery.scheduledTimeFrom ? `${delivery.scheduledTimeFrom} - ${delivery.scheduledTimeTo}` : undefined,
        status: delivery.status,
      } : undefined,
    };
  }
}
