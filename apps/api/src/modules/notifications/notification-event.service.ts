import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from '../../schemas/notification.schema';
import { Customer, CustomerDocument } from '../../schemas/customer.schema';
import { Order, OrderDocument } from '../../schemas/order.schema';
import { Branch, BranchDocument } from '../../schemas/branch.schema';
import { Tenant, TenantDocument } from '../../schemas/tenant.schema';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationPreferenceService } from './notification-preference.service';
import { NotificationAutomationService } from './notification-automation.service';
import { NotificationDispatcherService } from './notification-dispatcher.service';
import { AuditService } from '../audit/audit.service';
import {
  NotificationEventType,
  NotificationChannel,
  NotificationStatus,
} from '@washora/shared';

export interface NotificationEventPayload {
  tenantId: string | Types.ObjectId;
  branchId?: string | Types.ObjectId;
  customerId?: string | Types.ObjectId;
  orderId?: string | Types.ObjectId;
  eventType: NotificationEventType;
  channel?: NotificationChannel;
  recipient?: string;
  templateKey?: string;
  variables?: Record<string, any>;
  entityType?: string;
  entityId?: string;
  idempotencyKey?: string;
  actorUserId?: string | Types.ObjectId;
  isMarketing?: boolean;
}

@Injectable()
export class NotificationEventService {
  private readonly logger = new Logger(NotificationEventService.name);

  constructor(
    @InjectModel(Notification.name)
    private notifModel: Model<NotificationDocument>,
    @InjectModel(Customer.name)
    private customerModel: Model<CustomerDocument>,
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    @InjectModel(Branch.name)
    private branchModel: Model<BranchDocument>,
    @InjectModel(Tenant.name)
    private tenantModel: Model<TenantDocument>,
    private templateService: NotificationTemplateService,
    private preferenceService: NotificationPreferenceService,
    private automationService: NotificationAutomationService,
    private dispatcherService: NotificationDispatcherService,
    private auditService: AuditService,
  ) {}

  async emit(payload: NotificationEventPayload): Promise<NotificationDocument | null> {
    const tenantIdStr = payload.tenantId?.toString();
    const branchIdStr = payload.branchId?.toString();
    const customerIdStr = payload.customerId?.toString();
    const orderIdStr = payload.orderId?.toString();
    const channel = payload.channel || NotificationChannel.WHATSAPP;

    if (!tenantIdStr || !payload.eventType) {
      this.logger.warn('Notification event missing required tenantId or eventType');
      return null;
    }

    const tId = new Types.ObjectId(tenantIdStr);

    // 1. Resolve Customer & Recipient
    let recipient = payload.recipient?.trim();
    let customerName = payload.variables?.customerName;
    let customerPhone = payload.variables?.customerPhone;

    if (customerIdStr && Types.ObjectId.isValid(customerIdStr)) {
      const customer = await this.customerModel.findOne({
        _id: new Types.ObjectId(customerIdStr),
        tenantId: tId,
      });

      if (customer) {
        if (!recipient) recipient = customer.phone;
        if (!customerName) customerName = customer.name;
        if (!customerPhone) customerPhone = customer.phone;
      }
    }

    if (!recipient && orderIdStr && Types.ObjectId.isValid(orderIdStr)) {
      const order = await this.orderModel.findOne({
        _id: new Types.ObjectId(orderIdStr),
        tenantId: tId,
      });
      if (order && order.customerId) {
        const cust = await this.customerModel.findById(order.customerId);
        if (cust) {
          recipient = cust.phone;
          if (!customerName) customerName = cust.name;
          if (!customerPhone) customerPhone = cust.phone;
        }
      }
    }

    if (!recipient) {
      this.logger.warn(`No recipient found for event ${payload.eventType}`);
      return null;
    }

    // 2. Resolve Customer Preferences
    if (customerIdStr && Types.ObjectId.isValid(customerIdStr)) {
      const prefs = await this.preferenceService.getPreferences(
        tenantIdStr,
        customerIdStr,
      );

      if (payload.isMarketing && !prefs.marketingEnabled) {
        this.logger.log(`Customer ${customerIdStr} opted out of marketing notifications`);
        return null;
      }

      if (!payload.isMarketing && !prefs.transactionalEnabled) {
        this.logger.log(`Customer ${customerIdStr} opted out of transactional notifications`);
        return null;
      }

      if (channel === NotificationChannel.WHATSAPP && !prefs.whatsappEnabled) {
        this.logger.log(`Customer ${customerIdStr} opted out of WhatsApp notifications`);
        return null;
      }
    }

    // 3. Resolve Tenant Automation Rules
    const isEnabled = await this.automationService.isEventEnabled(
      tenantIdStr,
      payload.eventType,
      channel,
    );

    if (!isEnabled) {
      this.logger.log(`Event ${payload.eventType} is disabled in tenant automation settings`);
      return null;
    }

    // 4. Resolve Template
    const template = await this.templateService.resolveTemplate(
      tenantIdStr,
      payload.eventType,
      channel,
      branchIdStr,
      payload.templateKey,
    );

    // 5. Build Variables Map
    const variables: Record<string, any> = {
      customerName: customerName || 'Valued Customer',
      customerPhone: customerPhone || recipient,
      ...(payload.variables || {}),
    };

    // Format currency amounts if provided as numbers in paise
    if (typeof variables.totalAmount === 'number') {
      variables.totalAmount = `₹${(variables.totalAmount / 100).toFixed(2)}`;
    }
    if (typeof variables.paidAmount === 'number') {
      variables.paidAmount = `₹${(variables.paidAmount / 100).toFixed(2)}`;
    }
    if (typeof variables.dueAmount === 'number') {
      variables.dueAmount = `₹${(variables.dueAmount / 100).toFixed(2)}`;
    }
    if (typeof variables.paymentAmount === 'number') {
      variables.paymentAmount = `₹${(variables.paymentAmount / 100).toFixed(2)}`;
    }

    // 6. Safe Content Rendering
    const rendered = this.templateService.renderContent(template.content, variables);

    // 7. Idempotency Check
    const entityType = payload.entityType || (payload.orderId ? 'ORDER' : 'EVENT');
    const entityId =
      payload.entityId ||
      payload.orderId?.toString() ||
      payload.customerId?.toString() ||
      'GLOBAL';

    const idempotencyKey =
      payload.idempotencyKey ||
      `${tenantIdStr}_${payload.eventType}_${entityType}_${entityId}_${channel}_${template.templateKey}`;

    const existingNotif = await this.notifModel.findOne({
      tenantId: tId,
      idempotencyKey,
    });

    if (existingNotif && existingNotif.status !== NotificationStatus.FAILED) {
      this.logger.log(
        `Idempotency check: Notification already exists for key ${idempotencyKey} with status ${existingNotif.status}`,
      );
      return existingNotif;
    }

    // 8. Create Notification Record
    const newNotif = new this.notifModel({
      tenantId: tId,
      branchId: branchIdStr && Types.ObjectId.isValid(branchIdStr) ? new Types.ObjectId(branchIdStr) : null,
      customerId: customerIdStr && Types.ObjectId.isValid(customerIdStr) ? new Types.ObjectId(customerIdStr) : null,
      orderId: orderIdStr && Types.ObjectId.isValid(orderIdStr) ? new Types.ObjectId(orderIdStr) : null,
      eventType: payload.eventType,
      channel,
      templateId: template.templateId && Types.ObjectId.isValid(template.templateId) ? new Types.ObjectId(template.templateId) : null,
      templateKey: template.templateKey,
      recipient,
      renderedContent: rendered,
      variables,
      status: NotificationStatus.QUEUED,
      idempotencyKey,
      queuedAt: new Date(),
      createdBy: payload.actorUserId && Types.ObjectId.isValid(payload.actorUserId.toString()) ? new Types.ObjectId(payload.actorUserId.toString()) : null,
    });

    const saved = await newNotif.save();

    await this.auditService.log({
      tenantId: tenantIdStr,
      branchId: branchIdStr,
      actorUserId: payload.actorUserId?.toString(),
      action: 'NOTIFICATION_CREATED',
      entity: 'Notification',
      entityId: saved._id.toString(),
      metadata: {
        eventType: saved.eventType,
        channel: saved.channel,
        recipient: saved.recipient,
        templateKey: saved.templateKey,
      },
    });

    // 9. Dispatch to Provider
    return await this.dispatcherService.dispatch(saved);
  }
}
