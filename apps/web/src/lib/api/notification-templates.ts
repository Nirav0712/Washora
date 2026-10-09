import { apiClient } from './client';
import {
  NotificationTemplate,
  NotificationEventType,
  NotificationChannel,
  WhatsAppCategory,
  TemplateStatus,
} from '@washora/shared';

export interface CreateTemplatePayload {
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
}

export interface UpdateTemplatePayload {
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

export const notificationTemplatesApi = {
  list: (params?: { branchId?: string; eventType?: NotificationEventType; channel?: NotificationChannel; isActive?: boolean; search?: string }) =>
    apiClient.get<NotificationTemplate[]>('/notifications/templates', { params }),

  getById: (id: string) =>
    apiClient.get<NotificationTemplate>(`/notifications/templates/${id}`),

  create: (data: CreateTemplatePayload) =>
    apiClient.post<NotificationTemplate>('/notifications/templates', data),

  update: (id: string, data: UpdateTemplatePayload) =>
    apiClient.patch<NotificationTemplate>(`/notifications/templates/${id}`, data),

  enable: (id: string) =>
    apiClient.post<NotificationTemplate>(`/notifications/templates/${id}/enable`),

  disable: (id: string) =>
    apiClient.post<NotificationTemplate>(`/notifications/templates/${id}/disable`),
};
