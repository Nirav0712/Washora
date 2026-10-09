import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Customer, CustomerDocument } from '../../schemas/customer.schema';
import { Order, OrderDocument } from '../../schemas/order.schema';
import { Payment, PaymentDocument } from '../../schemas/payment.schema';
import { Notification, NotificationDocument } from '../../schemas/notification.schema';
import { Tenant, TenantDocument } from '../../schemas/tenant.schema';
import { Branch, BranchDocument } from '../../schemas/branch.schema';
import { PickupRequest, PickupRequestDocument } from '../../schemas/pickup-request.schema';
import { DeliveryRequest, DeliveryRequestDocument } from '../../schemas/delivery-request.schema';
import { NotificationPreferenceService } from '../notifications/notification-preference.service';
import { AuditService } from '../audit/audit.service';
import { UpdateProfileDto, CustomerAddressDto, UpdateCustomerAddressDto } from './dto/customer-auth.dto';
import { OrderStatus, CustomerDashboardData } from '@washora/shared';

@Injectable()
export class CustomerPortalService {
  private readonly logger = new Logger(CustomerPortalService.name);

  constructor(
    @InjectModel(Customer.name)
    private customerModel: Model<CustomerDocument>,
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,
    @InjectModel(Notification.name)
    private notifModel: Model<NotificationDocument>,
    @InjectModel(Tenant.name)
    private tenantModel: Model<TenantDocument>,
    @InjectModel(Branch.name)
    private branchModel: Model<BranchDocument>,
    @InjectModel(PickupRequest.name)
    private pickupModel: Model<PickupRequestDocument>,
    @InjectModel(DeliveryRequest.name)
    private deliveryModel: Model<DeliveryRequestDocument>,
    private preferenceService: NotificationPreferenceService,
    private auditService: AuditService,
  ) {}

  private toObjectId(id: string): Types.ObjectId {
    return new Types.ObjectId(id);
  }

  // ==========================================
  // DASHBOARD
  // ==========================================

  async getDashboard(tenantId: string, customerId: string): Promise<CustomerDashboardData> {
    const tId = this.toObjectId(tenantId);
    const cId = this.toObjectId(customerId);

    const [customer, tenant, orders, payments, notifs, upcomingPickup, upcomingDelivery] = await Promise.all([
      this.customerModel.findOne({ _id: cId, tenantId: tId, isDeleted: { $ne: true } }).exec(),
      this.tenantModel.findById(tId).exec(),
      this.orderModel.find({ customerId: cId, tenantId: tId, isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(10)
        .exec(),
      this.paymentModel.find({ customerId: cId, tenantId: tId }).sort({ createdAt: -1 }).limit(5).exec(),
      this.notifModel.find({ customerId: cId, tenantId: tId }).sort({ createdAt: -1 }).limit(5).exec(),
      this.pickupModel.findOne({
        customerId: cId,
        tenantId: tId,
        status: { $in: ['SCHEDULED', 'ASSIGNED', 'OUT_FOR_PICKUP'] },
      }).sort({ scheduledDate: 1 }).exec(),
      this.deliveryModel.findOne({
        customerId: cId,
        tenantId: tId,
        status: { $in: ['SCHEDULED', 'ASSIGNED', 'OUT_FOR_DELIVERY'] },
      }).sort({ scheduledDate: 1 }).exec(),
    ]);

    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }

    const activeOrders = orders.filter((o) =>
      o.status !== OrderStatus.DELIVERED &&
      o.status !== OrderStatus.COMPLETED &&
      o.status !== OrderStatus.CANCELLED
    );

    const readyOrders = orders.filter((o) => o.status === OrderStatus.READY);

    const amountDueTotal = orders.reduce((sum, o) => sum + (o.dueAmount || 0), 0);

    return {
      customer: {
        id: customer._id.toString(),
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        pendingBalance: amountDueTotal,
      },
      tenant: {
        id: tenant ? tenant._id.toString() : tenantId,
        name: tenant?.name || 'Washora Store',
        phone: tenant?.phone,
        email: tenant?.email,
      },
      stats: {
        activeOrdersCount: activeOrders.length,
        readyOrdersCount: readyOrders.length,
        amountDueTotal,
      },
      activeOrders: activeOrders.map((o) => this.sanitizeOrder(o)),
      recentOrders: orders.slice(0, 5).map((o) => this.sanitizeOrder(o)),
      upcomingPickup: upcomingPickup ? {
        id: upcomingPickup._id.toString(),
        pickupNumber: upcomingPickup.pickupNumber,
        scheduledDate: upcomingPickup.scheduledDate,
        timeSlot: `${upcomingPickup.scheduledTimeFrom || '10:00'} - ${upcomingPickup.scheduledTimeTo || '12:00'}`,
        status: upcomingPickup.status,
      } : undefined,
      upcomingDelivery: upcomingDelivery ? {
        id: upcomingDelivery._id.toString(),
        deliveryNumber: upcomingDelivery.deliveryNumber,
        scheduledDate: upcomingDelivery.scheduledDate,
        timeSlot: `${upcomingDelivery.scheduledTimeFrom || '14:00'} - ${upcomingDelivery.scheduledTimeTo || '16:00'}`,
        status: upcomingDelivery.status,
      } : undefined,
      recentNotifications: notifs.map((n) => ({
        id: n._id.toString(),
        eventType: n.eventType,
        channel: n.channel,
        renderedContent: n.renderedContent,
        status: n.status,
        createdAt: (n as any).createdAt,
      })),
    };
  }

  // ==========================================
  // PROFILE & ADDRESSES
  // ==========================================

  async getProfile(tenantId: string, customerId: string) {
    const customer = await this.customerModel.findOne({
      _id: this.toObjectId(customerId),
      tenantId: this.toObjectId(tenantId),
      isDeleted: { $ne: true },
    }).exec();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const profileData = {
      id: customer._id.toString(),
      customerId: customer._id.toString(),
      customerCode: customer.customerCode,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      gender: customer.gender,
      dateOfBirth: customer.dateOfBirth,
      isVip: customer.isVip,
      totalOrders: customer.totalOrders || 0,
      totalSpent: customer.totalSpent || 0,
      pendingBalance: customer.pendingBalance || 0,
      addresses: customer.addresses || [],
      createdAt: (customer as any).createdAt,
      updatedAt: (customer as any).updatedAt,
    };

    return {
      ...profileData,
      customer: profileData,
    };
  }

  async updateProfile(tenantId: string, customerId: string, dto: UpdateProfileDto) {
    const customer = await this.customerModel.findOne({
      _id: this.toObjectId(customerId),
      tenantId: this.toObjectId(tenantId),
      isDeleted: { $ne: true },
    }).exec();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (dto.name !== undefined) customer.name = dto.name.trim();
    if (dto.email !== undefined) customer.email = dto.email.trim().toLowerCase();

    await customer.save();

    await this.auditService.log({
      tenantId,
      action: 'CUSTOMER_PROFILE_UPDATED',
      entity: 'Customer',
      entityId: customer._id.toString(),
      metadata: { name: customer.name, email: customer.email },
    });

    return this.getProfile(tenantId, customerId);
  }

  async getAddresses(tenantId: string, customerId: string) {
    const profile = await this.getProfile(tenantId, customerId);
    return profile.addresses || [];
  }

  async addAddress(tenantId: string, customerId: string, dto: CustomerAddressDto) {
    const customer = await this.customerModel.findOne({
      _id: this.toObjectId(customerId),
      tenantId: this.toObjectId(tenantId),
      isDeleted: { $ne: true },
    }).exec();

    if (!customer) throw new NotFoundException('Customer not found');

    if (!customer.addresses) customer.addresses = [];

    // If first address or marked default, unset other defaults
    const isDefault = dto.isDefault || customer.addresses.length === 0;
    if (isDefault) {
      customer.addresses.forEach((a: any) => { a.isDefault = false; });
    }

    const newAddress: any = {
      _id: new Types.ObjectId(),
      label: dto.label || 'Home',
      name: dto.name || customer.name,
      phone: dto.phone || customer.phone,
      addressLine1: dto.addressLine1.trim(),
      addressLine2: dto.addressLine2?.trim(),
      area: dto.area?.trim(),
      city: dto.city?.trim() || 'Mumbai',
      state: dto.state?.trim() || 'Maharashtra',
      pincode: dto.pincode?.trim(),
      landmark: dto.landmark?.trim(),
      isDefault,
    };

    customer.addresses.push(newAddress);
    await customer.save();

    await this.auditService.log({
      tenantId,
      action: 'CUSTOMER_ADDRESS_CREATED',
      entity: 'Customer',
      entityId: customer._id.toString(),
      metadata: { addressId: newAddress._id.toString(), addressLine1: newAddress.addressLine1 },
    });

    return customer.addresses;
  }

  async updateAddress(tenantId: string, customerId: string, addressId: string, dto: UpdateCustomerAddressDto) {
    const customer = await this.customerModel.findOne({
      _id: this.toObjectId(customerId),
      tenantId: this.toObjectId(tenantId),
      isDeleted: { $ne: true },
    }).exec();

    if (!customer) throw new NotFoundException('Customer not found');

    const addressIndex = (customer.addresses || []).findIndex((a: any) => a._id?.toString() === addressId);
    if (addressIndex === -1) {
      throw new NotFoundException('Address not found');
    }

    if (dto.isDefault) {
      customer.addresses.forEach((a: any) => { a.isDefault = false; });
    }

    const addr = customer.addresses[addressIndex] as any;
    if (dto.label !== undefined) addr.label = dto.label;
    if (dto.name !== undefined) addr.name = dto.name;
    if (dto.phone !== undefined) addr.phone = dto.phone;
    if (dto.addressLine1 !== undefined) addr.addressLine1 = dto.addressLine1;
    if (dto.addressLine2 !== undefined) addr.addressLine2 = dto.addressLine2;
    if (dto.area !== undefined) addr.area = dto.area;
    if (dto.city !== undefined) addr.city = dto.city;
    if (dto.state !== undefined) addr.state = dto.state;
    if (dto.pincode !== undefined) addr.pincode = dto.pincode;
    if (dto.landmark !== undefined) addr.landmark = dto.landmark;
    if (dto.isDefault !== undefined) addr.isDefault = dto.isDefault;

    await customer.save();

    await this.auditService.log({
      tenantId,
      action: 'CUSTOMER_ADDRESS_UPDATED',
      entity: 'Customer',
      entityId: customer._id.toString(),
      metadata: { addressId },
    });

    return customer.addresses;
  }

  async deleteAddress(tenantId: string, customerId: string, addressId: string) {
    const customer = await this.customerModel.findOne({
      _id: this.toObjectId(customerId),
      tenantId: this.toObjectId(tenantId),
      isDeleted: { $ne: true },
    }).exec();

    if (!customer) throw new NotFoundException('Customer not found');

    const prevLength = customer.addresses.length;
    customer.addresses = (customer.addresses || []).filter((a: any) => a._id?.toString() !== addressId);

    if (customer.addresses.length === prevLength) {
      throw new NotFoundException('Address not found');
    }

    // Ensure at least one default if addresses remain
    if (customer.addresses.length > 0 && !customer.addresses.some((a: any) => a.isDefault)) {
      customer.addresses[0].isDefault = true;
    }

    await customer.save();

    await this.auditService.log({
      tenantId,
      action: 'CUSTOMER_ADDRESS_DELETED',
      entity: 'Customer',
      entityId: customer._id.toString(),
      metadata: { addressId },
    });

    return customer.addresses;
  }

  async setDefaultAddress(tenantId: string, customerId: string, addressId: string) {
    const customer = await this.customerModel.findOne({
      _id: this.toObjectId(customerId),
      tenantId: this.toObjectId(tenantId),
      isDeleted: { $ne: true },
    }).exec();

    if (!customer) throw new NotFoundException('Customer not found');

    let found = false;
    for (const a of customer.addresses || []) {
      if ((a as any)._id?.toString() === addressId) {
        a.isDefault = true;
        found = true;
      } else {
        a.isDefault = false;
      }
    }

    if (!found) throw new NotFoundException('Address not found');

    await customer.save();

    await this.auditService.log({
      tenantId,
      action: 'CUSTOMER_ADDRESS_UPDATED',
      entity: 'Customer',
      entityId: customer._id.toString(),
      metadata: { addressId, isDefault: true },
    });

    return customer.addresses;
  }

  // ==========================================
  // ORDERS & TRACKING
  // ==========================================

  async getOrders(tenantId: string, customerId: string, params: { page?: number; limit?: number; status?: string } = {}) {
    const page = Math.max(Number(params.page) || 1, 1);
    const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 50);
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      tenantId: this.toObjectId(tenantId),
      customerId: this.toObjectId(customerId),
      isDeleted: { $ne: true },
    };

    if (params.status) {
      filter.status = params.status;
    }

    const [orders, total] = await Promise.all([
      this.orderModel.find(filter)
        .populate('branchId', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments(filter).exec(),
    ]);

    return {
      items: orders.map((o) => this.sanitizeOrder(o)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getOrderById(tenantId: string, customerId: string, orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel.findOne({
      _id: this.toObjectId(orderId),
      customerId: this.toObjectId(customerId),
      tenantId: this.toObjectId(tenantId),
      isDeleted: { $ne: true },
    })
      .populate('branchId', 'name phone address')
      .populate('tenantId', 'name phone email logo')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found or access denied');
    }

    // Fetch related payments, pickup, delivery, notifications
    const [payments, pickup, delivery, notifs] = await Promise.all([
      this.paymentModel.find({ orderId: order._id, customerId: order.customerId, tenantId: order.tenantId }).sort({ createdAt: 1 }).exec(),
      this.pickupModel.findOne({ orderId: order._id, tenantId: order.tenantId }).exec(),
      this.deliveryModel.findOne({ orderId: order._id, tenantId: order.tenantId }).exec(),
      this.notifModel.find({ orderId: order._id, customerId: order.customerId, tenantId: order.tenantId }).sort({ createdAt: -1 }).exec(),
    ]);

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

    const steps = [
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

    return {
      ...this.sanitizeOrder(order),
      branch: order.branchId,
      items: (order.items || []).map((item: any) => ({
        id: item._id?.toString(),
        name: item.productNameSnapshot || item.name || 'Garment',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || item.unitPriceSnapshot || 0,
        lineTotal: item.lineTotal || item.itemTotalSnapshot || ((item.quantity || 1) * (item.unitPrice || 0)),
        serviceName: item.serviceNameSnapshot || 'Care',
        color: item.garmentColor || item.color,
        brand: item.garmentBrand || item.brand,
      })),
      timeline: (order.timeline || []).map((t: any) => ({
        status: t.status,
        label: t.label,
        timestamp: t.timestamp,
        isCompleted: t.isCompleted,
      })),
      timelineSteps: steps,
      payments: payments.map((p) => ({
        id: p._id.toString(),
        paymentNumber: p.paymentNumber,
        amount: p.amount,
        method: p.method,
        status: p.status,
        createdAt: (p as any).createdAt,
      })),
      pickup: pickup ? {
        id: pickup._id.toString(),
        pickupNumber: pickup.pickupNumber,
        scheduledDate: pickup.scheduledDate,
        timeSlot: `${pickup.scheduledTimeFrom} - ${pickup.scheduledTimeTo}`,
        status: pickup.status,
      } : undefined,
      delivery: delivery ? {
        id: delivery._id.toString(),
        deliveryNumber: delivery.deliveryNumber,
        scheduledDate: delivery.scheduledDate,
        timeSlot: `${delivery.scheduledTimeFrom} - ${delivery.scheduledTimeTo}`,
        status: delivery.status,
      } : undefined,
      notifications: notifs.map((n) => ({
        id: n._id.toString(),
        eventType: n.eventType,
        channel: n.channel,
        renderedContent: n.renderedContent,
        status: n.status,
        sentAt: n.sentAt || (n as any).createdAt,
      })),
    };
  }

  // ==========================================
  // PAYMENTS & INVOICES
  // ==========================================

  async getPayments(tenantId: string, customerId: string, params: { page?: number; limit?: number } = {}) {
    const page = Math.max(Number(params.page) || 1, 1);
    const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 50);
    const skip = (page - 1) * limit;

    const filter = {
      tenantId: this.toObjectId(tenantId),
      customerId: this.toObjectId(customerId),
    };

    const [payments, total] = await Promise.all([
      this.paymentModel.find(filter)
        .populate('orderId', 'orderNumber grandTotal paidAmount dueAmount status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.paymentModel.countDocuments(filter).exec(),
    ]);

    return {
      items: payments.map((p) => ({
        id: p._id.toString(),
        paymentNumber: p.paymentNumber,
        orderId: (p.orderId as any)?._id?.toString(),
        orderNumber: (p.orderId as any)?.orderNumber || 'N/A',
        amount: p.amount,
        method: p.method,
        status: p.status,
        referenceNumber: p.referenceNumber,
        createdAt: (p as any).createdAt,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async getInvoices(tenantId: string, customerId: string) {
    const orders = await this.orderModel.find({
      tenantId: this.toObjectId(tenantId),
      customerId: this.toObjectId(customerId),
      isDeleted: { $ne: true },
    })
      .populate('branchId', 'name phone')
      .sort({ createdAt: -1 })
      .exec();

    return orders.map((o) => ({
      orderId: o._id.toString(),
      orderNumber: o.orderNumber,
      invoiceNumber: (o as any).invoiceNumber || `INV-${o.orderNumber}`,
      invoiceDate: (o as any).invoiceDate || (o as any).createdAt,
      totalAmount: o.grandTotal,
      paidAmount: o.paidAmount,
      dueAmount: o.dueAmount,
      paymentStatus: o.paymentStatus,
      status: o.status,
      branchName: (o.branchId as any)?.name || 'Main Branch',
    }));
  }

  async getInvoiceById(tenantId: string, customerId: string, orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order/invoice ID');
    }

    const order = await this.orderModel.findOne({
      _id: this.toObjectId(orderId),
      customerId: this.toObjectId(customerId),
      tenantId: this.toObjectId(tenantId),
      isDeleted: { $ne: true },
    })
      .populate('tenantId', 'name phone email address logo')
      .populate('branchId', 'name phone address')
      .populate('customerId', 'name phone email addresses')
      .exec();

    if (!order) {
      throw new NotFoundException('Invoice not found or access denied');
    }

    const payments = await this.paymentModel.find({
      orderId: order._id,
      customerId: order.customerId,
      tenantId: order.tenantId,
    }).sort({ createdAt: 1 }).exec();

    return {
      invoiceNumber: (order as any).invoiceNumber || `INV-${order.orderNumber}`,
      invoiceDate: (order as any).invoiceDate || (order as any).createdAt,
      orderNumber: order.orderNumber,
      tenant: order.tenantId,
      branch: order.branchId,
      customer: {
        name: (order.customerId as any)?.name,
        phone: (order.customerId as any)?.phone,
        email: (order.customerId as any)?.email,
      },
      items: (order.items || []).map((item: any) => ({
        name: item.productNameSnapshot || item.name || 'Garment',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || item.unitPriceSnapshot || 0,
        totalPrice: item.lineTotal || item.itemTotalSnapshot || ((item.quantity || 1) * (item.unitPrice || 0)),
      })),
      subtotal: order.subtotal,
      taxTotal: order.taxAmount || 0,
      discountAmount: order.discountAmount,
      grandTotal: order.grandTotal,
      paidAmount: order.paidAmount,
      dueAmount: order.dueAmount,
      paymentStatus: order.paymentStatus,
      payments: payments.map((p) => ({
        paymentNumber: p.paymentNumber,
        amount: p.amount,
        method: p.method,
        createdAt: (p as any).createdAt,
      })),
    };
  }

  // ==========================================
  // NOTIFICATIONS & PREFERENCES
  // ==========================================

  async getNotifications(tenantId: string, customerId: string, params: { page?: number; limit?: number } = {}) {
    const page = Math.max(Number(params.page) || 1, 1);
    const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 50);
    const skip = (page - 1) * limit;

    const filter = {
      tenantId: this.toObjectId(tenantId),
      customerId: this.toObjectId(customerId),
    };

    const [notifs, total] = await Promise.all([
      this.notifModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notifModel.countDocuments(filter).exec(),
    ]);

    return {
      items: notifs.map((n) => ({
        id: n._id.toString(),
        eventType: n.eventType,
        channel: n.channel,
        renderedContent: n.renderedContent,
        status: n.status,
        sentAt: n.sentAt || (n as any).createdAt,
        deliveredAt: n.deliveredAt,
        readAt: n.readAt,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async getPreferences(tenantId: string, customerId: string) {
    const pref = await this.preferenceService.getPreferences(tenantId, customerId);
    return {
      transactional: {
        whatsapp: pref.whatsappEnabled !== false,
        sms: pref.smsEnabled !== false,
        email: pref.emailEnabled !== false,
      },
      marketing: {
        whatsapp: !!pref.marketingEnabled,
        email: !!pref.marketingEnabled,
        sms: !!pref.marketingEnabled,
      },
      ...pref,
    };
  }

  async updatePreferences(tenantId: string, customerId: string, dto: any) {
    const flatDto: any = {};
    if (dto.transactional) {
      if (dto.transactional.whatsapp !== undefined) flatDto.whatsappEnabled = dto.transactional.whatsapp;
      if (dto.transactional.sms !== undefined) flatDto.smsEnabled = dto.transactional.sms;
      if (dto.transactional.email !== undefined) flatDto.emailEnabled = dto.transactional.email;
    }
    if (dto.marketing) {
      if (dto.marketing.whatsapp !== undefined) flatDto.marketingEnabled = dto.marketing.whatsapp;
    }
    if (dto.whatsappEnabled !== undefined) flatDto.whatsappEnabled = dto.whatsappEnabled;
    if (dto.smsEnabled !== undefined) flatDto.smsEnabled = dto.smsEnabled;
    if (dto.emailEnabled !== undefined) flatDto.emailEnabled = dto.emailEnabled;
    if (dto.marketingEnabled !== undefined) flatDto.marketingEnabled = dto.marketingEnabled;

    const saved = await this.preferenceService.updatePreferences(tenantId, customerId, flatDto);
    return {
      transactional: {
        whatsapp: saved.whatsappEnabled !== false,
        sms: saved.smsEnabled !== false,
        email: saved.emailEnabled !== false,
      },
      marketing: {
        whatsapp: !!saved.marketingEnabled,
        email: !!saved.marketingEnabled,
        sms: !!saved.marketingEnabled,
      },
      ...saved,
    };
  }

  // Helper sanitizer: Strips out internal costs, margins, staff notes, supplier info
  private sanitizeOrder(order: any) {
    return {
      id: order._id.toString(),
      _id: order._id.toString(),
      orderNumber: order.orderNumber,
      orderDate: order.createdAt || order.orderDate,
      status: order.status,
      paymentStatus: order.paymentStatus,
      pricingTier: order.pricingTier,
      grandTotal: order.grandTotal,
      paidAmount: order.paidAmount,
      dueAmount: order.dueAmount,
      itemCount: (order.items || []).reduce((acc: number, i: any) => acc + (i.quantity || 1), 0),
      expectedReadyAt: order.expectedReadyAt,
      completedAt: order.completedAt,
      trackingToken: order.trackingToken,
      branchName: (order.branchId as any)?.name || 'Main Hub',
    };
  }
}
