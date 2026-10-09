import { apiClient } from './client';
import {
  WhatsAppSettings,
  CustomerNotificationPreferences,
  NotificationAutomationRule,
} from '@washora/shared';

export interface UpdateWhatsAppSettingsPayload {
  enabled?: boolean;
  provider?: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  accessToken?: string;
  webhookEnabled?: boolean;
  webhookVerifyToken?: string;
  defaultLanguage?: string;
}

export interface UpdateCustomerPreferencesPayload {
  whatsappEnabled?: boolean;
  smsEnabled?: boolean;
  emailEnabled?: boolean;
  transactionalEnabled?: boolean;
  marketingEnabled?: boolean;
  preferredLanguage?: string;
}

export const notificationSettingsApi = {
  getWhatsAppSettings: () =>
    apiClient.get<WhatsAppSettings>('/notifications/settings/whatsapp'),

  updateWhatsAppSettings: (data: UpdateWhatsAppSettingsPayload) =>
    apiClient.patch<WhatsAppSettings>('/notifications/settings/whatsapp', data),

  getCustomerPreferences: (customerId: string) =>
    apiClient.get<CustomerNotificationPreferences>(`/notifications/preferences/${customerId}`),

  updateCustomerPreferences: (customerId: string, data: UpdateCustomerPreferencesPayload) =>
    apiClient.patch<CustomerNotificationPreferences>(`/notifications/preferences/${customerId}`, data),

  getAutomation: () =>
    apiClient.get<{ tenantId: string; rules: NotificationAutomationRule[] }>('/notifications/automation'),

  updateAutomation: (rules: NotificationAutomationRule[]) =>
    apiClient.patch<{ tenantId: string; rules: NotificationAutomationRule[] }>('/notifications/automation', { rules }),
};
