import {
  NotificationChannel,
  NotificationEventType,
  NotificationStatus,
  WhatsAppCategory,
} from '@washora/shared';

export interface SendNotificationRequest {
  tenantId: string;
  recipient: string;
  content: string;
  templateKey?: string;
  templateId?: string;
  providerTemplateId?: string;
  language?: string;
  variables?: Record<string, any>;
  category?: WhatsAppCategory;
  tenantSettings?: any;
}

export interface ProviderErrorDetails {
  code: string;
  message: string;
  isTransient: boolean;
}

export interface SendNotificationResult {
  success: boolean;
  providerMessageId?: string;
  status: NotificationStatus;
  error?: ProviderErrorDetails;
  rawResponse?: Record<string, any>;
}

export interface WebhookEventResult {
  providerMessageId: string;
  status: NotificationStatus;
  timestamp?: Date;
  errorCode?: string;
  errorMessage?: string;
  recipient?: string;
  raw?: any;
}

export interface NotificationProvider {
  readonly name: string;
  readonly channel: NotificationChannel;

  send(req: SendNotificationRequest): Promise<SendNotificationResult>;
  getStatus(
    providerMessageId: string,
    tenantSettings?: any,
  ): Promise<NotificationStatus>;
  handleWebhook(
    payload: any,
    headers?: Record<string, string>,
  ): Promise<WebhookEventResult[]>;
}
