import { apiClient } from './client';
import { TenantSettings } from '@washora/shared';

export const settingsApi = {
  async get(): Promise<TenantSettings> {
    return apiClient.get<TenantSettings>('/settings');
  },

  async update(payload: Partial<TenantSettings>): Promise<TenantSettings> {
    return apiClient.patch<TenantSettings>('/settings', payload);
  },
};
