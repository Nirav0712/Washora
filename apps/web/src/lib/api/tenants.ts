import { apiClient } from './client';
import { Tenant } from '@washora/shared';

export const tenantsApi = {
  async getCurrent(): Promise<Tenant> {
    return apiClient.get<Tenant>('/tenants/current');
  },

  async updateCurrent(payload: Partial<Tenant>): Promise<Tenant> {
    return apiClient.patch<Tenant>('/tenants/current', payload);
  },
};
