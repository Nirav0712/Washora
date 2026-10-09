import { apiClient } from './client';
import { Category } from '@washora/shared';

export interface CategoryListResponse {
  data: Category[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const categoriesApi = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    branchId?: string;
    isActive?: boolean;
  }): Promise<Category[]> {
    const res = await apiClient.get<any>('/categories', { params });
    if (res && res.data && Array.isArray(res.data)) {
      return res.data;
    }
    return Array.isArray(res) ? res : [];
  },

  async getById(id: string): Promise<Category> {
    return apiClient.get<Category>(`/categories/${id}`);
  },

  async create(payload: Partial<Category>): Promise<Category> {
    return apiClient.post<Category>('/categories', payload);
  },

  async update(id: string, payload: Partial<Category>): Promise<Category> {
    return apiClient.patch<Category>(`/categories/${id}`, payload);
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/categories/${id}`);
  },
};
