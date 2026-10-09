import { apiClient } from './client';
import {
  NotificationRecord,
  NotificationStats,
  NotificationEventType,
  NotificationChannel,
  NotificationStatus,
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

export const notificationsApi = {
  list: (params?: NotificationFilterParams) =>
    apiClient.get<{ data: NotificationRecord[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      '/notifications',
      { params },
    ),

  getStats: (branchId?: string) =>
    apiClient.get<NotificationStats>('/notifications/stats', {
      params: branchId ? { branchId } : undefined,
    }),

  getById: (id: string) =>
    apiClient.get<NotificationRecord>(`/notifications/${id}`),

  resend: (id: string) =>
    apiClient.post<NotificationRecord>(`/notifications/${id}/resend`),
};
