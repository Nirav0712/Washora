import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from '../../schemas/notification.schema';
import { NotificationDispatcherService } from './notification-dispatcher.service';
import { WhatsAppProvider } from './providers/whatsapp.provider';
import { AuditService } from '../audit/audit.service';
import {
  NotificationChannel,
  NotificationEventType,
  NotificationStatus,
  NotificationStats,
} from '@washora/shared';

export interface NotificationFilterParams {
  branchId?: string;
  customerId?: string;
  orderId?: string;
  eventType?: NotificationEventType;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private notifModel: Model<NotificationDocument>,
    private dispatcherService: NotificationDispatcherService,
    private whatsappProvider: WhatsAppProvider,
    private auditService: AuditService,
  ) {}

  async findAll(
    tenantId: string,
    params: NotificationFilterParams = {},
  ): Promise<{ data: NotificationDocument[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const page = Math.max(Number(params.page) || 1, 1);
    const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      tenantId: new Types.ObjectId(tenantId),
    };

    if (params.branchId && Types.ObjectId.isValid(params.branchId)) {
      filter.branchId = new Types.ObjectId(params.branchId);
    }
    if (params.customerId && Types.ObjectId.isValid(params.customerId)) {
      filter.customerId = new Types.ObjectId(params.customerId);
    }
    if (params.orderId && Types.ObjectId.isValid(params.orderId)) {
      filter.orderId = new Types.ObjectId(params.orderId);
    }
    if (params.eventType) filter.eventType = params.eventType;
    if (params.channel) filter.channel = params.channel;
    if (params.status) filter.status = params.status;

    if (params.startDate || params.endDate) {
      filter.createdAt = {};
      if (params.startDate) filter.createdAt.$gte = new Date(params.startDate);
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    if (params.search) {
      filter.$or = [
        { recipient: { $regex: params.search, $options: 'i' } },
        { renderedContent: { $regex: params.search, $options: 'i' } },
        { providerMessageId: { $regex: params.search, $options: 'i' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.notifModel.countDocuments(filter),
      this.notifModel
        .find(filter)
        .populate('customerId', 'name phone email')
        .populate('orderId', 'orderNumber grandTotal status')
        .populate('branchId', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findById(tenantId: string, id: string): Promise<NotificationDocument> {
    const notif = await this.notifModel
      .findOne({
        _id: new Types.ObjectId(id),
        tenantId: new Types.ObjectId(tenantId),
      })
      .populate('customerId', 'name phone email')
      .populate('orderId', 'orderNumber grandTotal paidAmount dueAmount status')
      .populate('branchId', 'name code')
      .populate('templateId', 'name templateKey content variables');

    if (!notif) {
      throw new NotFoundException('Notification not found or access denied');
    }

    return notif;
  }

  async getStats(tenantId: string, branchId?: string): Promise<NotificationStats> {
    const filter: Record<string, any> = {
      tenantId: new Types.ObjectId(tenantId),
    };
    if (branchId && Types.ObjectId.isValid(branchId)) {
      filter.branchId = new Types.ObjectId(branchId);
    }

    const results = await this.notifModel.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const stats: NotificationStats = {
      total: 0,
      queued: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      skipped: 0,
    };

    for (const r of results) {
      stats.total += r.count;
      if (r._id === NotificationStatus.QUEUED) stats.queued = r.count;
      else if (r._id === NotificationStatus.SENT) stats.sent = r.count;
      else if (r._id === NotificationStatus.DELIVERED) stats.delivered = r.count;
      else if (r._id === NotificationStatus.READ) stats.read = r.count;
      else if (r._id === NotificationStatus.FAILED) stats.failed = r.count;
      else if (r._id === NotificationStatus.SKIPPED) stats.skipped = r.count;
    }

    return stats;
  }

  async resend(
    tenantId: string,
    id: string,
    actorUserId?: string,
  ): Promise<NotificationDocument> {
    const notif = await this.findById(tenantId, id);

    notif.status = NotificationStatus.QUEUED;
    notif.queuedAt = new Date();

    const dispatched = await this.dispatcherService.dispatch(notif);

    await this.auditService.log({
      tenantId,
      actorUserId,
      branchId: notif.branchId?.toString(),
      action: 'NOTIFICATION_RESENT',
      entity: 'Notification',
      entityId: notif._id.toString(),
      metadata: {
        eventType: notif.eventType,
        channel: notif.channel,
        recipient: notif.recipient,
        newStatus: dispatched.status,
      },
    });

    return dispatched;
  }

  async handleWebhook(
    channel: NotificationChannel,
    payload: any,
    headers?: Record<string, string>,
  ): Promise<{ processed: number; updated: number }> {
    let events: any[] = [];
    if (channel === NotificationChannel.WHATSAPP) {
      events = await this.whatsappProvider.handleWebhook(payload, headers);
    }

    let updatedCount = 0;
    for (const ev of events) {
      if (!ev.providerMessageId) continue;

      const notif = await this.notifModel.findOne({
        providerMessageId: ev.providerMessageId,
      });

      if (!notif) continue;

      // Update status idempotently
      notif.status = ev.status;
      if (ev.status === NotificationStatus.DELIVERED) {
        notif.deliveredAt = ev.timestamp || new Date();
      } else if (ev.status === NotificationStatus.READ) {
        notif.readAt = ev.timestamp || new Date();
        if (!notif.deliveredAt) notif.deliveredAt = ev.timestamp || new Date();
      } else if (ev.status === NotificationStatus.FAILED) {
        notif.failedAt = ev.timestamp || new Date();
        if (ev.errorCode) notif.errorCode = ev.errorCode;
        if (ev.errorMessage) notif.errorMessage = ev.errorMessage;
      }

      await notif.save();
      updatedCount++;
    }

    return { processed: events.length, updated: updatedCount };
  }
}
