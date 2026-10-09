import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BillingInvoice, BillingInvoiceDocument } from '../../../schemas/billing-invoice.schema';
import { BillingPayment, BillingPaymentDocument } from '../../../schemas/billing-payment.schema';
import { TenantSubscription, TenantSubscriptionDocument } from '../../../schemas/tenant-subscription.schema';
import { Counter, CounterDocument } from '../../../schemas/counter.schema';
import { AuditService } from '../../audit/audit.service';
import { MockBillingProvider } from './mock-billing-provider.service';
import {
  BillingInvoiceStatus,
  BillingPaymentStatus,
  SubscriptionStatus,
} from '@washora/shared';
import {
  CreateBillingInvoiceDto,
  RecordBillingPaymentDto,
  ProcessWebhookDto,
} from '../dto/saas-billing.dto';

@Injectable()
export class SaasBillingService {
  private readonly logger = new Logger(SaasBillingService.name);
  private readonly processedWebhookEvents = new Set<string>();

  constructor(
    @InjectModel(BillingInvoice.name)
    private invoiceModel: Model<BillingInvoiceDocument>,
    @InjectModel(BillingPayment.name)
    private paymentModel: Model<BillingPaymentDocument>,
    @InjectModel(TenantSubscription.name)
    private subscriptionModel: Model<TenantSubscriptionDocument>,
    @InjectModel(Counter.name)
    private counterModel: Model<CounterDocument>,
    private auditService: AuditService,
    private billingProvider: MockBillingProvider,
  ) {}

  private async getNextSequence(sequenceName: string, prefix: string): Promise<string> {
    const dummyId = new Types.ObjectId('000000000000000000000000');
    const counter = await this.counterModel.findOneAndUpdate(
      { tenantId: dummyId, sequenceName },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );
    const seqNum = counter.seq.toString().padStart(6, '0');
    return `${prefix}-${seqNum}`;
  }

  async createInvoice(dto: CreateBillingInvoiceDto, actorAdminId?: string) {
    const tenantObjectId = new Types.ObjectId(dto.tenantId);
    const subObjectId = new Types.ObjectId(dto.subscriptionId);

    const subscription = await this.subscriptionModel.findById(subObjectId).exec();
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const invoiceNumber = await this.getNextSequence('PLATFORM_BILLING_INVOICE', 'SINV');
    const subtotal = dto.subtotal;
    const tax = dto.tax ?? Math.round(subtotal * 0.18 * 100) / 100; // 18% GST default
    const discount = dto.discount || 0;
    const total = Math.max(0, Math.round((subtotal + tax - discount) * 100) / 100);

    const invoice = await this.invoiceModel.create({
      invoiceNumber,
      tenantId: tenantObjectId,
      subscriptionId: subObjectId,
      billingPeriodStart: new Date(dto.billingPeriodStart),
      billingPeriodEnd: new Date(dto.billingPeriodEnd),
      subtotal,
      tax,
      discount,
      total,
      currency: (dto.currency || 'INR').toUpperCase().trim(),
      status: BillingInvoiceStatus.OPEN,
      issuedAt: new Date(),
      dueAt: new Date(dto.dueAt),
    });

    await this.auditService.log({
      tenantId: dto.tenantId,
      action: 'BILLING_INVOICE_CREATED',
      entity: 'BillingInvoice',
      entityId: invoice._id.toString(),
      metadata: { invoiceNumber, total, actorAdminId },
    });

    return invoice;
  }

  async recordPayment(dto: RecordBillingPaymentDto, actorAdminId?: string) {
    const invoice = await this.invoiceModel.findById(new Types.ObjectId(dto.invoiceId)).exec();
    if (!invoice) {
      throw new NotFoundException('Billing invoice not found');
    }

    if (invoice.status === BillingInvoiceStatus.PAID) {
      throw new ConflictException(`Invoice ${invoice.invoiceNumber} is already paid`);
    }

    const paymentNumber = await this.getNextSequence('PLATFORM_BILLING_PAYMENT', 'SPAY');
    const payment = await this.paymentModel.create({
      paymentNumber,
      tenantId: invoice.tenantId,
      invoiceId: invoice._id,
      subscriptionId: invoice.subscriptionId,
      amount: dto.amount,
      currency: invoice.currency,
      status: BillingPaymentStatus.SUCCESS,
      provider: dto.provider || 'MOCK_GATEWAY',
      providerPaymentId: dto.providerPaymentId || `pay_manual_${Date.now()}`,
      paidAt: new Date(),
    });

    invoice.status = BillingInvoiceStatus.PAID;
    invoice.paidAt = new Date();
    await invoice.save();

    // Activate/Renew subscription if needed
    const sub = await this.subscriptionModel.findById(invoice.subscriptionId).exec();
    if (sub && (sub.status === SubscriptionStatus.TRIALING || sub.status === SubscriptionStatus.PAST_DUE)) {
      sub.status = SubscriptionStatus.ACTIVE;
      await sub.save();
    }

    await this.auditService.log({
      tenantId: invoice.tenantId.toString(),
      action: 'BILLING_PAYMENT_RECORDED',
      entity: 'BillingPayment',
      entityId: payment._id.toString(),
      metadata: { paymentNumber, invoiceNumber: invoice.invoiceNumber, amount: payment.amount, actorAdminId },
    });

    return { payment, invoice };
  }

  async handleWebhook(dto: ProcessWebhookDto, rawBody?: any) {
    // Idempotency: Reject duplicate webhook events
    if (this.processedWebhookEvents.has(dto.eventId)) {
      this.logger.warn(`Duplicate webhook event ignored: ${dto.eventId}`);
      return { success: true, message: 'Event already processed', isDuplicate: true };
    }

    const verified = await this.billingProvider.verifyWebhook({}, rawBody || dto);
    if (!verified.isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    if (verified.event === 'payment.success') {
      const invoiceNumber = verified.invoiceNumber;
      if (!invoiceNumber) {
        throw new BadRequestException('Missing invoice number in webhook payload');
      }

      const invoice = await this.invoiceModel.findOne({ invoiceNumber }).exec();
      if (!invoice) {
        throw new NotFoundException(`Invoice with number ${invoiceNumber} not found`);
      }

      // Check if duplicate payment with providerPaymentId exists
      const existingPay = await this.paymentModel.findOne({ providerPaymentId: verified.providerPaymentId }).exec();
      if (!existingPay) {
        const paymentNumber = await this.getNextSequence('PLATFORM_BILLING_PAYMENT', 'SPAY');
        await this.paymentModel.create({
          paymentNumber,
          tenantId: invoice.tenantId,
          invoiceId: invoice._id,
          subscriptionId: invoice.subscriptionId,
          amount: verified.amount || invoice.total,
          currency: invoice.currency,
          status: BillingPaymentStatus.SUCCESS,
          provider: 'MOCK_GATEWAY',
          providerPaymentId: verified.providerPaymentId,
          paidAt: new Date(),
        });
      }

      invoice.status = BillingInvoiceStatus.PAID;
      invoice.paidAt = new Date();
      await invoice.save();

      const sub = await this.subscriptionModel.findById(invoice.subscriptionId).exec();
      if (sub && (sub.status === SubscriptionStatus.TRIALING || sub.status === SubscriptionStatus.PAST_DUE)) {
        sub.status = SubscriptionStatus.ACTIVE;
        await sub.save();
      }

      this.processedWebhookEvents.add(dto.eventId);

      await this.auditService.log({
        tenantId: invoice.tenantId.toString(),
        action: 'BILLING_WEBHOOK_PROCESSED',
        entity: 'BillingInvoice',
        entityId: invoice._id.toString(),
        metadata: { eventId: dto.eventId, invoiceNumber },
      });
    }

    return { success: true, eventId: dto.eventId };
  }

  async listInvoices(params: {
    tenantId?: string;
    status?: BillingInvoiceStatus;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (params.tenantId) filter.tenantId = new Types.ObjectId(params.tenantId);
    if (params.status) filter.status = params.status;

    const [items, total] = await Promise.all([
      this.invoiceModel
        .find(filter)
        .populate('tenantId', 'name slug email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.invoiceModel.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getInvoiceById(id: string) {
    const invoice = await this.invoiceModel
      .findById(new Types.ObjectId(id))
      .populate('tenantId', 'name slug email phone address')
      .populate('subscriptionId')
      .exec();

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }

  async listPayments(params: {
    tenantId?: string;
    invoiceId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (params.tenantId) filter.tenantId = new Types.ObjectId(params.tenantId);
    if (params.invoiceId) filter.invoiceId = new Types.ObjectId(params.invoiceId);

    const [items, total] = await Promise.all([
      this.paymentModel
        .find(filter)
        .populate('tenantId', 'name slug')
        .populate('invoiceId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.paymentModel.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getBillingOverview() {
    const [totalRevenueResult, openInvoicesResult, totalInvoices, totalPayments] = await Promise.all([
      this.paymentModel.aggregate([
        { $match: { status: BillingPaymentStatus.SUCCESS } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
      ]),
      this.invoiceModel.aggregate([
        { $match: { status: BillingInvoiceStatus.OPEN } },
        { $group: { _id: null, totalOutstanding: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      this.invoiceModel.countDocuments(),
      this.paymentModel.countDocuments(),
    ]);

    return {
      totalRevenue: totalRevenueResult[0]?.totalRevenue || 0,
      totalOutstanding: openInvoicesResult[0]?.totalOutstanding || 0,
      openInvoicesCount: openInvoicesResult[0]?.count || 0,
      totalInvoices,
      totalPayments,
    };
  }
}
