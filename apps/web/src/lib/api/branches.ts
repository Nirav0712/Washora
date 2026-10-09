import { apiClient } from './client';
import { Branch } from '@washora/shared';

export const branchesApi = {
  async getAll(): Promise<Branch[]> {
    return apiClient.get<Branch[]>('/branches');
  },

  async getById(id: string): Promise<Branch> {
    return apiClient.get<Branch>(`/branches/${id}`);
  },

  async create(payload: Partial<Branch>): Promise<Branch> {
    return apiClient.post<Branch>('/branches', payload);
  },

  async update(id: string, payload: Partial<Branch>): Promise<Branch> {
    return apiClient.patch<Branch>(`/branches/${id}`, payload);
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/branches/${id}`);
  },
};
