import { apiClient } from './client';
import { Service } from '@washora/shared';

export const servicesApi = {
  async getAll(): Promise<Service[]> {
    return apiClient.get<Service[]>('/services');
  },

  async getById(id: string): Promise<Service> {
    return apiClient.get<Service>(`/services/${id}`);
  },

  async create(payload: Partial<Service>): Promise<Service> {
    return apiClient.post<Service>('/services', payload);
  },

  async update(id: string, payload: Partial<Service>): Promise<Service> {
    return apiClient.patch<Service>(`/services/${id}`, payload);
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/services/${id}`);
  },
};
