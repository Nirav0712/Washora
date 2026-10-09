import { apiClient } from './client';
import { Product, ProductPrice, BranchPriceOverride } from '@washora/shared';

export const productsApi = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    branchId?: string;
    serviceId?: string;
    isActive?: boolean;
  }): Promise<Product[]> {
    const res = await apiClient.get<any>('/products', { params });
    if (res && res.data && Array.isArray(res.data)) {
      return res.data;
    }
    return Array.isArray(res) ? res : [];
  },

  async getById(id: string, branchId?: string): Promise<Product> {
    return apiClient.get<Product>(`/products/${id}`, {
      params: branchId ? { branchId } : undefined,
    });
  },

  async create(payload: Partial<Product>): Promise<Product> {
    return apiClient.post<Product>('/products', payload);
  },

  async update(id: string, payload: Partial<Product>): Promise<Product> {
    return apiClient.patch<Product>(`/products/${id}`, payload);
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/products/${id}`);
  },

  async updatePricing(id: string, prices: ProductPrice): Promise<Product> {
    return apiClient.patch<Product>(`/products/${id}/pricing`, { prices });
  },

  async updateBranchPrices(
    id: string,
    branchPriceOverrides: BranchPriceOverride[],
  ): Promise<Product> {
    return apiClient.patch<Product>(`/products/${id}/branch-prices`, {
      branchPriceOverrides,
    });
  },
};
