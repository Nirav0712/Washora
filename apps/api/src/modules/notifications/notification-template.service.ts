import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  NotificationTemplate,
  NotificationTemplateDocument,
} from '../../schemas/notification-template.schema';
import {
  NotificationEventType,
  NotificationChannel,
  TemplateStatus,
  WhatsAppCategory,
} from '@washora/shared';

export const ALLOWED_TEMPLATE_VARIABLES = [
  'customerName',
  'customerPhone',
  'orderNumber',
  'orderStatus',
  'totalAmount',
  'paidAmount',
  'dueAmount',
  'pickupDate',
  'pickupTime',
  'deliveryDate',
  'deliveryTime',
  'agentName',
  'shopName',
  'branchName',
  'invoiceNumber',
  'invoiceUrl',
  'trackingUrl',
  'failureReason',
  'pickupNumber',
  'deliveryNumber',
  'paymentMethod',
  'paymentAmount',
];

export const SYSTEM_DEFAULT_TEMPLATES: Record<
  NotificationEventType,
  { name: string; templateKey: string; content: string; variables: string[] }
> = {
  [NotificationEventType.ORDER_CREATED]: {
    name: 'Order Created Default',
    templateKey: 'order_created_default',
    content:
      'Hello {{customerName}}, your order {{orderNumber}} has been placed with {{shopName}}. Total: {{totalAmount}}. We will notify you when processing begins.',
    variables: ['customerName', 'orderNumber', 'shopName', 'totalAmount'],
  },
  [NotificationEventType.ORDER_CONFIRMED]: {
    name: 'Order Confirmed Default',
    templateKey: 'order_confirmed_default',
    content:
      'Hi {{customerName}}, your laundry order {{orderNumber}} is confirmed at {{branchName}}. We are taking great care of your garments.',
    variables: ['customerName', 'orderNumber', 'branchName'],
  },
  [NotificationEventType.PROCESSING_STARTED]: {
    name: 'Processing Started Default',
    templateKey: 'processing_started_default',
    content:
      'Hi {{customerName}}, processing has begun for your laundry order {{orderNumber}} at {{branchName}}.',
    variables: ['customerName', 'orderNumber', 'branchName'],
  },
  [NotificationEventType.PROCESSING_STATUS_UPDATED]: {
    name: 'Processing Update Default',
    templateKey: 'processing_status_updated_default',
    content:
      'Update for order {{orderNumber}}: your garments are now in {{orderStatus}} stage.',
    variables: ['orderNumber', 'orderStatus'],
  },
  [NotificationEventType.QC_COMPLETED]: {
    name: 'QC Completed Default',
    templateKey: 'qc_completed_default',
    content:
      'Quality check completed for order {{orderNumber}}. Your garments are clean and packed!',
    variables: ['orderNumber'],
  },
  [NotificationEventType.ORDER_READY]: {
    name: 'Order Ready Default',
    templateKey: 'order_ready_default',
    content:
      'Great news {{customerName}}! Your order {{orderNumber}} is READY for pickup/delivery at {{branchName}}. Balance due: {{dueAmount}}.',
    variables: ['customerName', 'orderNumber', 'branchName', 'dueAmount'],
  },
  [NotificationEventType.ORDER_CANCELLED]: {
    name: 'Order Cancelled Default',
    templateKey: 'order_cancelled_default',
    content:
      'Your order {{orderNumber}} with {{shopName}} has been cancelled. Reason: {{failureReason}}.',
    variables: ['orderNumber', 'shopName', 'failureReason'],
  },
  [NotificationEventType.PICKUP_SCHEDULED]: {
    name: 'Pickup Scheduled Default',
    templateKey: 'pickup_scheduled_default',
    content:
      'Hello {{customerName}}, pickup #{{pickupNumber}} is scheduled for {{pickupDate}} ({{pickupTime}}) by {{shopName}}.',
    variables: ['customerName', 'pickupNumber', 'pickupDate', 'pickupTime', 'shopName'],
  },
  [NotificationEventType.PICKUP_REMINDER]: {
    name: 'Pickup Reminder Default',
    templateKey: 'pickup_reminder_default',
    content:
      'Reminder: Laundry pickup for {{customerName}} is scheduled today between {{pickupTime}}.',
    variables: ['customerName', 'pickupTime'],
  },
  [NotificationEventType.PICKUP_OUT_FOR_PICKUP]: {
    name: 'Driver Out For Pickup Default',
    templateKey: 'pickup_out_for_pickup_default',
    content:
      'Our driver {{agentName}} is on the way to pick up your laundry for pickup #{{pickupNumber}}.',
    variables: ['agentName', 'pickupNumber'],
  },
  [NotificationEventType.PICKUP_COMPLETED]: {
    name: 'Pickup Completed Default',
    templateKey: 'pickup_completed_default',
    content:
      'Your laundry has been picked up successfully by {{agentName}}. Order intake in progress!',
    variables: ['agentName'],
  },
  [NotificationEventType.PICKUP_FAILED]: {
    name: 'Pickup Failed Default',
    templateKey: 'pickup_failed_default',
    content:
      'Pickup attempt #{{pickupNumber}} could not be completed. Reason: {{failureReason}}. We will contact you to reschedule.',
    variables: ['pickupNumber', 'failureReason'],
  },
  [NotificationEventType.DELIVERY_SCHEDULED]: {
    name: 'Delivery Scheduled Default',
    templateKey: 'delivery_scheduled_default',
    content:
      'Hello {{customerName}}, delivery #{{deliveryNumber}} for order {{orderNumber}} is scheduled for {{deliveryDate}} ({{deliveryTime}}).',
    variables: ['customerName', 'deliveryNumber', 'orderNumber', 'deliveryDate', 'deliveryTime'],
  },
  [NotificationEventType.DELIVERY_REMINDER]: {
    name: 'Delivery Reminder Default',
    templateKey: 'delivery_reminder_default',
    content:
      'Reminder: Your delivery #{{deliveryNumber}} for order {{orderNumber}} is scheduled today between {{deliveryTime}}.',
    variables: ['deliveryNumber', 'orderNumber', 'deliveryTime'],
  },
  [NotificationEventType.DELIVERY_OUT_FOR_DELIVERY]: {
    name: 'Out For Delivery Default',
    templateKey: 'delivery_out_for_delivery_default',
    content:
      'Driver {{agentName}} is out for delivery with order {{orderNumber}}. Amount due on delivery: {{dueAmount}}.',
    variables: ['agentName', 'orderNumber', 'dueAmount'],
  },
  [NotificationEventType.DELIVERY_COMPLETED]: {
    name: 'Delivery Completed Default',
    templateKey: 'delivery_completed_default',
    content:
      'Order {{orderNumber}} has been delivered to {{customerName}}. Thank you for choosing {{shopName}}!',
    variables: ['orderNumber', 'customerName', 'shopName'],
  },
  [NotificationEventType.DELIVERY_FAILED]: {
    name: 'Delivery Failed Default',
    templateKey: 'delivery_failed_default',
    content:
      'Delivery attempt for order {{orderNumber}} could not be completed. Reason: {{failureReason}}. We will reschedule soon.',
    variables: ['orderNumber', 'failureReason'],
  },
  [NotificationEventType.PAYMENT_RECEIVED]: {
    name: 'Payment Received Default',
    templateKey: 'payment_received_default',
    content:
      'Payment received: {{paymentAmount}} for order {{orderNumber}}. Remaining balance: {{dueAmount}}. Thank you!',
    variables: ['paymentAmount', 'orderNumber', 'dueAmount'],
  },
  [NotificationEventType.PAYMENT_DUE]: {
    name: 'Payment Due Default',
    templateKey: 'payment_due_default',
    content:
      'Payment reminder: Amount due for order {{orderNumber}} is {{dueAmount}}. Please settle at your earliest convenience.',
    variables: ['orderNumber', 'dueAmount'],
  },
  [NotificationEventType.INVOICE_READY]: {
    name: 'Invoice Ready Default',
    templateKey: 'invoice_ready_default',
    content:
      'Invoice #{{invoiceNumber}} is ready for order {{orderNumber}}. Total: {{totalAmount}}.',
    variables: ['invoiceNumber', 'orderNumber', 'totalAmount'],
  },
};

export interface CreateTemplateDto {
  name: string;
  eventType: NotificationEventType;
  channel?: NotificationChannel;
  templateKey: string;
  providerTemplateId?: string;
  language?: string;
  category?: WhatsAppCategory;
  content: string;
  branchId?: string;
  isDefault?: boolean;
  status?: TemplateStatus;
  isActive?: boolean;
}

export interface UpdateTemplateDto {
  name?: string;
  eventType?: NotificationEventType;
  channel?: NotificationChannel;
  templateKey?: string;
  providerTemplateId?: string;
  language?: string;
  category?: WhatsAppCategory;
  content?: string;
  branchId?: string;
  isDefault?: boolean;
  status?: TemplateStatus;
  isActive?: boolean;
}

@Injectable()
export class NotificationTemplateService {
  private readonly logger = new Logger(NotificationTemplateService.name);

  constructor(
    @InjectModel(NotificationTemplate.name)
    private templateModel: Model<NotificationTemplateDocument>,
  ) {}

  extractVariables(content: string): string[] {
    if (!content) return [];
    const matches = content.match(/\{\{([a-zA-Z0-9_]+)\}\}/g);
    if (!matches) return [];
    const vars = matches.map((m) => m.replace(/[\{\}]/g, '').trim());
    return Array.from(new Set(vars));
  }

  validateVariables(variables: string[]) {
    for (const v of variables) {
      if (!ALLOWED_TEMPLATE_VARIABLES.includes(v)) {
        throw new BadRequestException(
          `Invalid or unknown template variable: {{${v}}}. Allowed variables: ${ALLOWED_TEMPLATE_VARIABLES.join(', ')}`,
        );
      }
    }
  }

  renderContent(content: string, variables: Record<string, any> = {}): string {
    if (!content) return '';
    return content.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, varName) => {
      if (variables[varName] !== undefined && variables[varName] !== null) {
        return String(variables[varName]);
      }
      return '';
    });
  }

  async create(
    tenantId: string,
    dto: CreateTemplateDto,
    userId?: string,
  ): Promise<NotificationTemplateDocument> {
    const extracted = this.extractVariables(dto.content);
    this.validateVariables(extracted);

    // Check duplicate templateKey for tenant
    const existing = await this.templateModel.findOne({
      tenantId: new Types.ObjectId(tenantId),
      templateKey: dto.templateKey.trim().toLowerCase(),
    });

    if (existing) {
      throw new BadRequestException(
        `Template with key '${dto.templateKey}' already exists for this tenant`,
      );
    }

    const created = new this.templateModel({
      tenantId: new Types.ObjectId(tenantId),
      branchId: dto.branchId ? new Types.ObjectId(dto.branchId) : null,
      name: dto.name.trim(),
      eventType: dto.eventType,
      channel: dto.channel || NotificationChannel.WHATSAPP,
      templateKey: dto.templateKey.trim().toLowerCase(),
      providerTemplateId: dto.providerTemplateId?.trim(),
      language: dto.language || 'en_US',
      category: dto.category || WhatsAppCategory.UTILITY,
      content: dto.content,
      variables: extracted,
      status: dto.status || TemplateStatus.APPROVED,
      isActive: dto.isActive !== false,
      isDefault: !!dto.isDefault,
      createdBy: userId ? new Types.ObjectId(userId) : null,
    });

    return await created.save();
  }

  async update(
    tenantId: string,
    templateId: string,
    dto: UpdateTemplateDto,
    userId?: string,
  ): Promise<NotificationTemplateDocument> {
    const template = await this.templateModel.findOne({
      _id: new Types.ObjectId(templateId),
      tenantId: new Types.ObjectId(tenantId),
    });

    if (!template) {
      throw new NotFoundException('Template not found or does not belong to tenant');
    }

    if (dto.content !== undefined) {
      const extracted = this.extractVariables(dto.content);
      this.validateVariables(extracted);
      template.content = dto.content;
      template.variables = extracted;
    }

    if (dto.name !== undefined) template.name = dto.name.trim();
    if (dto.eventType !== undefined) template.eventType = dto.eventType;
    if (dto.channel !== undefined) template.channel = dto.channel;
    if (dto.providerTemplateId !== undefined)
      template.providerTemplateId = dto.providerTemplateId?.trim();
    if (dto.language !== undefined) template.language = dto.language;
    if (dto.category !== undefined) template.category = dto.category;
    if (dto.branchId !== undefined)
      template.branchId = dto.branchId ? new Types.ObjectId(dto.branchId) : null;
    if (dto.isDefault !== undefined) template.isDefault = dto.isDefault;
    if (dto.status !== undefined) template.status = dto.status;
    if (dto.isActive !== undefined) template.isActive = dto.isActive;
    if (userId) template.updatedBy = new Types.ObjectId(userId);

    return await template.save();
  }

  async findAll(
    tenantId: string,
    query: {
      branchId?: string;
      eventType?: NotificationEventType;
      channel?: NotificationChannel;
      isActive?: boolean;
      search?: string;
    } = {},
  ): Promise<NotificationTemplateDocument[]> {
    const filter: Record<string, any> = {
      tenantId: new Types.ObjectId(tenantId),
    };

    if (query.branchId) {
      filter.$or = [
        { branchId: new Types.ObjectId(query.branchId) },
        { branchId: null },
      ];
    }

    if (query.eventType) filter.eventType = query.eventType;
    if (query.channel) filter.channel = query.channel;
    if (query.isActive !== undefined) filter.isActive = query.isActive;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { templateKey: { $regex: query.search, $options: 'i' } },
        { content: { $regex: query.search, $options: 'i' } },
      ];
    }

    return await this.templateModel.find(filter).sort({ isDefault: -1, createdAt: -1 });
  }

  async findById(
    tenantId: string,
    templateId: string,
  ): Promise<NotificationTemplateDocument> {
    const template = await this.templateModel.findOne({
      _id: new Types.ObjectId(templateId),
      tenantId: new Types.ObjectId(tenantId),
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return template;
  }

  async resolveTemplate(
    tenantId: string,
    eventType: NotificationEventType,
    channel: NotificationChannel = NotificationChannel.WHATSAPP,
    branchId?: string,
    preferredTemplateKey?: string,
  ): Promise<{
    templateId?: string;
    templateKey: string;
    content: string;
    variables: string[];
    providerTemplateId?: string;
    language: string;
    category?: WhatsAppCategory;
  }> {
    const tId = new Types.ObjectId(tenantId);

    // 1. If explicit templateKey requested, try finding it
    if (preferredTemplateKey) {
      const explicit = await this.templateModel.findOne({
        tenantId: tId,
        templateKey: preferredTemplateKey,
        isActive: true,
      });
      if (explicit) {
        return {
          templateId: explicit._id.toString(),
          templateKey: explicit.templateKey,
          content: explicit.content,
          variables: explicit.variables,
          providerTemplateId: explicit.providerTemplateId,
          language: explicit.language || 'en_US',
          category: explicit.category,
        };
      }
    }

    // 2. Branch template
    if (branchId && Types.ObjectId.isValid(branchId)) {
      const branchTemplate = await this.templateModel.findOne({
        tenantId: tId,
        branchId: new Types.ObjectId(branchId),
        eventType,
        channel,
        isActive: true,
      });
      if (branchTemplate) {
        return {
          templateId: branchTemplate._id.toString(),
          templateKey: branchTemplate.templateKey,
          content: branchTemplate.content,
          variables: branchTemplate.variables,
          providerTemplateId: branchTemplate.providerTemplateId,
          language: branchTemplate.language || 'en_US',
          category: branchTemplate.category,
        };
      }
    }

    // 3. Tenant template (default or active)
    const tenantTemplate = await this.templateModel
      .findOne({
        tenantId: tId,
        eventType,
        channel,
        isActive: true,
      })
      .sort({ isDefault: -1, createdAt: -1 });

    if (tenantTemplate) {
      return {
        templateId: tenantTemplate._id.toString(),
        templateKey: tenantTemplate.templateKey,
        content: tenantTemplate.content,
        variables: tenantTemplate.variables,
        providerTemplateId: tenantTemplate.providerTemplateId,
        language: tenantTemplate.language || 'en_US',
        category: tenantTemplate.category,
      };
    }

    // 4. System default fallback
    const sysDefault = SYSTEM_DEFAULT_TEMPLATES[eventType] || {
      name: 'Generic Event',
      templateKey: `${eventType.toLowerCase()}_default`,
      content: 'Notification for {{customerName}} regarding order {{orderNumber}}.',
      variables: ['customerName', 'orderNumber'],
    };

    return {
      templateKey: sysDefault.templateKey,
      content: sysDefault.content,
      variables: sysDefault.variables,
      language: 'en_US',
      category: WhatsAppCategory.UTILITY,
    };
  }

  async setStatus(
    tenantId: string,
    templateId: string,
    isActive: boolean,
    userId?: string,
  ): Promise<NotificationTemplateDocument> {
    const template = await this.findById(tenantId, templateId);
    template.isActive = isActive;
    if (userId) template.updatedBy = new Types.ObjectId(userId);
    return await template.save();
  }
}
