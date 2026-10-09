import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from '../../schemas/notification.schema';
import { WhatsAppProvider } from './providers/whatsapp.provider';
import { WhatsAppSettingsService } from './whatsapp-settings.service';
import { NotificationChannel, NotificationStatus } from '@washora/shared';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class NotificationDispatcherService {
  private readonly logger = new Logger(NotificationDispatcherService.name);

  constructor(
    @InjectModel(Notification.name)
    private notifModel: Model<NotificationDocument>,
    private whatsappProvider: WhatsAppProvider,
    private whatsappSettingsService: WhatsAppSettingsService,
    private auditService: AuditService,
  ) {}

  async dispatch(notification: NotificationDocument): Promise<NotificationDocument> {
    const tenantId = notification.tenantId.toString();

    // Check channel
    if (notification.channel === NotificationChannel.WHATSAPP) {
      const settings = await this.whatsappSettingsService.getInternalSettings(tenantId);

      const reqPayload = {
        tenantId,
        recipient: notification.recipient,
        content: notification.renderedContent,
        templateKey: notification.templateKey,
        templateId: notification.templateId?.toString(),
        variables: notification.variables,
        tenantSettings: settings,
      };

      let attempt = notification.attemptCount || 0;
      let lastResult: any;

      // Safe retry loop for transient errors (up to 2 retry attempts)
      while (attempt < 3) {
        attempt++;
        notification.attemptCount = attempt;

        lastResult = await this.whatsappProvider.send(reqPayload);

        if (lastResult.success) {
          notification.status = NotificationStatus.SENT;
          notification.providerMessageId = lastResult.providerMessageId;
          notification.providerResponse = lastResult.rawResponse;
          notification.sentAt = new Date();
          notification.errorCode = undefined;
          notification.errorMessage = undefined;
          break;
        }

        // If error is permanent, abort immediately
        if (!lastResult.error?.isTransient) {
          notification.status = NotificationStatus.FAILED;
          notification.errorCode = lastResult.error?.code || 'PERMANENT_ERROR';
          notification.errorMessage = lastResult.error?.message;
          notification.providerResponse = lastResult.rawResponse;
          notification.failedAt = new Date();
          break;
        }

        // If transient and we reached max attempts, mark failed
        if (attempt >= 3) {
          notification.status = NotificationStatus.FAILED;
          notification.errorCode = lastResult.error?.code || 'MAX_RETRIES_EXCEEDED';
          notification.errorMessage = lastResult.error?.message || 'Maximum retry attempts exceeded';
          notification.providerResponse = lastResult.rawResponse;
          notification.failedAt = new Date();
          break;
        }
      }

      const saved = await notification.save();

      if (saved.status === NotificationStatus.SENT) {
        await this.auditService.log({
          tenantId,
          action: 'NOTIFICATION_SENT',
          entity: 'Notification',
          entityId: saved._id.toString(),
          metadata: {
            eventType: saved.eventType,
            channel: saved.channel,
            recipient: saved.recipient,
            providerMessageId: saved.providerMessageId,
          },
        });
      } else if (saved.status === NotificationStatus.FAILED) {
        await this.auditService.log({
          tenantId,
          action: 'NOTIFICATION_FAILED',
          entity: 'Notification',
          entityId: saved._id.toString(),
          metadata: {
            eventType: saved.eventType,
            channel: saved.channel,
            recipient: saved.recipient,
            errorCode: saved.errorCode,
            errorMessage: saved.errorMessage,
          },
        });
      }

      return saved;
    }

    // Other channels (SMS, EMAIL, RCS, PUSH) are architectural boundaries in Phase 08
    notification.status = NotificationStatus.SKIPPED;
    notification.errorMessage = `Channel ${notification.channel} is not yet provisioned in Phase 08`;
    notification.failedAt = new Date();
    return await notification.save();
  }
}
