import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument } from '../../schemas/payment.schema';
import { Order, OrderDocument } from '../../schemas/order.schema';
import { Customer, CustomerDocument } from '../../schemas/customer.schema';
import { CounterService } from '../../common/services/counter.service';
import { AuditService } from '../audit/audit.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentStatus, OrderStatus } from '@washora/shared';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    private counterService: CounterService,
    private auditService: AuditService,
  ) {}

  async findAll(
    tenantId: string | Types.ObjectId,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      method?: string;
      status?: string;
      branchId?: string;
      customerId?: string;
      orderId?: string;
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
    };

    if (userBranchIds && userBranchIds.length > 0) {
      filter.branchId = { $in: userBranchIds.map((id) => new Types.ObjectId(id)) };
    }
    if (query.branchId && Types.ObjectId.isValid(query.branchId)) {
      filter.branchId = new Types.ObjectId(query.branchId);
    }

    if (query.method) filter.method = query.method;
    if (query.status) filter.status = query.status;

    if (query.customerId && Types.ObjectId.isValid(query.customerId)) {
      filter.customerId = new Types.ObjectId(query.customerId);
    }
    if (query.orderId && Types.ObjectId.isValid(query.orderId)) {
      filter.orderId = new Types.ObjectId(query.orderId);
    }

    if (query.search) {
      const s = query.search.trim();
      filter.$or = [
        { paymentNumber: { $regex: s, $options: 'i' } },
        { referenceNumber: { $regex: s, $options: 'i' } },
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

    const [payments, total] = await Promise.all([
      this.paymentModel
        .find(filter)
        .populate('orderId', 'orderNumber grandTotal paidAmount dueAmount status')
        .populate('customerId', 'name phone email')
        .populate('branchId', 'name code')
        .populate('receivedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.paymentModel.countDocuments(filter),
    ]);

    return {
      items: payments.map((p) => {
        const obj = p.toObject();
        return {
          ...obj,
          id: p._id.toString(),
          orderNumber: (p.orderId as any)?.orderNumber,
          customerName: (p.customerId as any)?.name,
          customerPhone: (p.customerId as any)?.phone,
          branchName: (p.branchId as any)?.name,
          receivedByName: (p.receivedBy as any)?.name || 'Staff',
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

  async findById(tenantId: string | Types.ObjectId, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid payment ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const payment = await this.paymentModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: tId })
      .populate('orderId', 'orderNumber grandTotal paidAmount dueAmount status customerSnapshot items')
      .populate('customerId', 'name phone email addresses')
      .populate('branchId', 'name code city address')
      .populate('receivedBy', 'name email')
      .exec();

    if (!payment) {
      throw new NotFoundException('Payment record not found.');
    }

    return {
      ...payment.toObject(),
      id: payment._id.toString(),
    };
  }

  async findByOrderId(tenantId: string | Types.ObjectId, orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const payments = await this.paymentModel
      .find({ orderId: new Types.ObjectId(orderId), tenantId: tId })
      .sort({ createdAt: -1 })
      .populate('receivedBy', 'name email')
      .exec();

    return payments.map((p) => ({
      ...p.toObject(),
      id: p._id.toString(),
    }));
  }

  async create(
    tenantId: string | Types.ObjectId,
    actorUserId: string | Types.ObjectId,
    actorUserName = 'Staff',
    dto: CreatePaymentDto,
  ) {
    if (!Types.ObjectId.isValid(dto.orderId)) {
      throw new BadRequestException('Invalid order ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const uId = new Types.ObjectId(actorUserId.toString());

    const order = await this.orderModel
      .findOne({ _id: new Types.ObjectId(dto.orderId), tenantId: tId, isDeleted: false })
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot record payment for a cancelled order.');
    }

    const payAmount = Math.round(dto.amount * 100) / 100;
    if (payAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero.');
    }

    // Validate overpayment: allow max dueAmount with 0.01 tolerance
    if (payAmount > order.dueAmount + 0.01) {
      throw new BadRequestException(
        `Payment amount (₹${payAmount}) exceeds remaining due balance of ₹${order.dueAmount}.`,
      );
    }

    const paymentNumber = await this.counterService.generatePaymentNumber(tId);

    const payment = new this.paymentModel({
      tenantId: tId,
      branchId: order.branchId,
      orderId: order._id,
      customerId: order.customerId,
      paymentNumber,
      amount: payAmount,
      method: dto.method,
      status: 'COMPLETED',
      referenceNumber: dto.referenceNumber,
      notes: dto.notes,
      receivedBy: uId,
    });

    await payment.save();

    // Update order financials server-side
    const newPaidAmount = Math.round((order.paidAmount + payAmount) * 100) / 100;
    const newDueAmount = Math.max(0, Math.round((order.grandTotal - newPaidAmount) * 100) / 100);

    let newPaymentStatus: PaymentStatus;
    if (newPaidAmount >= order.grandTotal || newDueAmount <= 0) {
      newPaymentStatus = PaymentStatus.PAID;
    } else if (newPaidAmount > 0) {
      newPaymentStatus = PaymentStatus.PARTIAL;
    } else {
      newPaymentStatus = PaymentStatus.UNPAID;
    }

    order.paidAmount = newPaidAmount;
    order.dueAmount = newDueAmount;
    order.paymentStatus = newPaymentStatus;
    order.paymentMethod = dto.method;
    order.updatedBy = uId;

    order.timeline.push({
      status: order.status,
      label: `Payment Received: ₹${payAmount} via ${dto.method}`,
      timestamp: new Date(),
      updatedBy: actorUserName,
      note: dto.referenceNumber ? `Txn Ref: ${dto.referenceNumber}` : (dto.notes || 'Counter payment'),
      isCompleted: true,
    });

    await order.save();

    // Update customer stats
    await this.updateCustomerStats(tId, order.customerId as Types.ObjectId);

    await this.auditService.log({
      tenantId: tId,
      branchId: order.branchId,
      actorUserId: uId,
      action: 'PAYMENT_CREATED',
      entity: 'Payment',
      entityId: payment._id.toString(),
      metadata: {
        paymentNumber,
        amount: payAmount,
        method: dto.method,
        orderNumber: order.orderNumber,
        remainingDue: newDueAmount,
      },
    });

    return this.findById(tId, payment._id.toString());
  }

  async refund(
    tenantId: string | Types.ObjectId,
    id: string,
    actorUserId: string | Types.ObjectId,
    actorUserName = 'Staff',
    dto: RefundPaymentDto,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid payment ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const uId = new Types.ObjectId(actorUserId.toString());

    const payment = await this.paymentModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: tId })
      .exec();

    if (!payment) {
      throw new NotFoundException('Payment record not found.');
    }

    if (payment.status === 'VOID' || payment.status === 'REFUNDED') {
      throw new BadRequestException('Payment is already fully refunded or voided.');
    }

    const currentRefunded = payment.refundAmount || 0;
    const availableToRefund = Math.round((payment.amount - currentRefunded) * 100) / 100;
    const requestedRefund = Math.round(dto.amount * 100) / 100;

    if (requestedRefund > availableToRefund) {
      throw new BadRequestException(
        `Requested refund (₹${requestedRefund}) exceeds available refundable amount of ₹${availableToRefund}.`,
      );
    }

    const newRefundAmount = Math.round((currentRefunded + requestedRefund) * 100) / 100;
    payment.refundAmount = newRefundAmount;
    payment.refundReason = dto.reason;
    payment.status = newRefundAmount >= payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    await payment.save();

    // Adjust Order financials
    const order = await this.orderModel
      .findOne({ _id: payment.orderId, tenantId: tId })
      .exec();

    if (order) {
      const newPaidAmount = Math.max(0, Math.round((order.paidAmount - requestedRefund) * 100) / 100);
      const newDueAmount = Math.max(0, Math.round((order.grandTotal - newPaidAmount) * 100) / 100);

      let newPaymentStatus: PaymentStatus;
      if (newPaidAmount >= order.grandTotal && order.grandTotal > 0) {
        newPaymentStatus = PaymentStatus.PAID;
      } else if (newPaidAmount > 0) {
        newPaymentStatus = PaymentStatus.PARTIAL;
      } else {
        newPaymentStatus = PaymentStatus.UNPAID;
      }

      order.paidAmount = newPaidAmount;
      order.dueAmount = newDueAmount;
      order.paymentStatus = newPaymentStatus;
      order.updatedBy = uId;

      order.timeline.push({
        status: order.status,
        label: `Payment Refunded: ₹${requestedRefund} (${payment.method})`,
        timestamp: new Date(),
        updatedBy: actorUserName,
        note: `Reason: ${dto.reason}${dto.referenceNumber ? ` | Ref: ${dto.referenceNumber}` : ''}`,
        isCompleted: true,
      });

      await order.save();
      await this.updateCustomerStats(tId, order.customerId as Types.ObjectId);
    }

    await this.auditService.log({
      tenantId: tId,
      branchId: payment.branchId,
      actorUserId: uId,
      action: 'PAYMENT_REFUNDED',
      entity: 'Payment',
      entityId: payment._id.toString(),
      metadata: {
        paymentNumber: payment.paymentNumber,
        refundAmount: requestedRefund,
        reason: dto.reason,
      },
    });

    return this.findById(tId, payment._id.toString());
  }

  private async updateCustomerStats(tenantId: Types.ObjectId, customerId: Types.ObjectId) {
    const orders = await this.orderModel.find({
      tenantId,
      customerId,
      isDeleted: false,
      status: { $ne: OrderStatus.CANCELLED },
    }).exec();

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
          totalOrders: orders.length,
          totalSpent: Math.round(totalSpent * 100) / 100,
          pendingBalance: Math.max(0, Math.round(pendingBalance * 100) / 100),
        },
      },
    ).exec();
  }
}
