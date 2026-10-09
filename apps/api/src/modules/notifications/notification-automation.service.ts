import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  NotificationAutomation,
  NotificationAutomationDocument,
} from '../../schemas/notification-automation.schema';
import {
  NotificationEventType,
  NotificationChannel,
  NotificationAutomationRule,
} from '@washora/shared';

export const DEFAULT_AUTOMATION_RULES: NotificationAutomationRule[] = [
  { eventType: NotificationEventType.ORDER_CREATED, channel: NotificationChannel.WHATSAPP, enabled: true },
  { eventType: NotificationEventType.ORDER_CONFIRMED, channel: NotificationChannel.WHATSAPP, enabled: true },
  { eventType: NotificationEventType.PROCESSING_STARTED, channel: NotificationChannel.WHATSAPP, enabled: false },
  { eventType: NotificationEventType.PROCESSING_STATUS_UPDATED, channel: NotificationChannel.WHATSAPP, enabled: false },
  { eventType: NotificationEventType.QC_COMPLETED, channel: NotificationChannel.WHATSAPP, enabled: false },
  { eventType: NotificationEventType.ORDER_READY, channel: NotificationChannel.WHATSAPP, enabled: true },
  { eventType: NotificationEventType.ORDER_CANCELLED, channel: NotificationChannel.WHATSAPP, enabled: true },
  { eventType: NotificationEventType.PICKUP_SCHEDULED, channel: NotificationChannel.WHATSAPP, enabled: true },
  { eventType: NotificationEventType.PICKUP_REMINDER, channel: NotificationChannel.WHATSAPP, enabled: true },
  { eventType: NotificationEventType.PICKUP_OUT_FOR_PICKUP, channel: NotificationChannel.WHATSAPP, enabled: true },
  { eventType: NotificationEventType.PICKUP_COMPLETED, channel: NotificationChannel.WHATSAPP, enabled: true },
  { eventType: NotificationEventType.PICKUP_FAILED, channel: NotificationChannel.WHATSAPP, enabled: true },
  { eventType: NotificationEventType.DELIVERY_SCHEDULED, channel: NotificationChannel.WHATSAPP, enabled: true },
  { eventType: NotificationEventType.DELIVERY_REMINDER, channel: NotificationChannel.WHATSAPP, enabled: true },
  { eventType: NotificationEventType.DELIVERY_OUT_FOR_DELIVERY, channel: NotificationChannel.WHATSAPP, enabled: true },
  { eventType: NotificationEventType.DELIVERY_COMPLETED, channel: NotificationChannel.WHATSAPP, enabled: true },
  { eventType: NotificationEventType.DELIVERY_FAILED, channel: NotificationChannel.WHATSAPP, enabled: true },
  { eventType: NotificationEventType.PAYMENT_RECEIVED, channel: NotificationChannel.WHATSAPP, enabled: true },
  { eventType: NotificationEventType.PAYMENT_DUE, channel: NotificationChannel.WHATSAPP, enabled: true },
  { eventType: NotificationEventType.INVOICE_READY, channel: NotificationChannel.WHATSAPP, enabled: true },
];

@Injectable()
export class NotificationAutomationService {
  private readonly logger = new Logger(NotificationAutomationService.name);

  constructor(
    @InjectModel(NotificationAutomation.name)
    private autoModel: Model<NotificationAutomationDocument>,
  ) {}

  async getAutomation(
    tenantId: string,
  ): Promise<{ tenantId: string; rules: NotificationAutomationRule[] }> {
    const tId = new Types.ObjectId(tenantId);
    let auto = await this.autoModel.findOne({ tenantId: tId });

    if (!auto || !auto.rules || auto.rules.length === 0) {
      return {
        tenantId,
        rules: [...DEFAULT_AUTOMATION_RULES],
      };
    }

    // Merge default rules with stored rules to ensure all events are present
    const ruleMap = new Map<string, NotificationAutomationRule>();
    for (const d of DEFAULT_AUTOMATION_RULES) {
      ruleMap.set(`${d.eventType}_${d.channel}`, { ...d });
    }
    for (const r of auto.rules) {
      ruleMap.set(`${r.eventType}_${r.channel}`, {
        eventType: r.eventType,
        channel: r.channel,
        enabled: r.enabled,
        templateKey: r.templateKey,
        templateId: r.templateId ? r.templateId.toString() : undefined,
      });
    }

    return {
      tenantId,
      rules: Array.from(ruleMap.values()),
    };
  }

  async isEventEnabled(
    tenantId: string,
    eventType: NotificationEventType,
    channel: NotificationChannel = NotificationChannel.WHATSAPP,
  ): Promise<boolean> {
    const auto = await this.getAutomation(tenantId);
    const rule = auto.rules.find(
      (r) => r.eventType === eventType && r.channel === channel,
    );
    if (!rule) return false;
    return rule.enabled;
  }

  async updateAutomation(
    tenantId: string,
    rules: NotificationAutomationRule[],
  ): Promise<{ tenantId: string; rules: NotificationAutomationRule[] }> {
    const tId = new Types.ObjectId(tenantId);
    let auto = await this.autoModel.findOne({ tenantId: tId });

    if (!auto) {
      auto = new this.autoModel({
        tenantId: tId,
        rules: [],
      });
    }

    auto.rules = rules.map((r) => ({
      eventType: r.eventType,
      channel: r.channel,
      enabled: !!r.enabled,
      templateKey: r.templateKey?.trim(),
      templateId: r.templateId && Types.ObjectId.isValid(r.templateId) ? new Types.ObjectId(r.templateId) : null,
    })) as any;

    await auto.save();
    return await this.getAutomation(tenantId);
  }
}
