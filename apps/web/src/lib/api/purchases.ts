import { apiClient } from './client';
import { Purchase, PurchaseStatus, PurchasePaymentStatus, ExpensePaymentMethod } from '@washora/shared';

export interface PurchaseItemPayload {
  inventoryItemId: string;
  quantity: number;
  unitCost: number;
  taxRate?: number;
}

export interface CreatePurchasePayload {
  branchId: string;
  supplierId: string;
  purchaseDate?: string;
  items: PurchaseItemPayload[];
  discount?: number;
  notes?: string;
  status?: PurchaseStatus;
}

export interface PurchaseListParams {
  branchId?: string;
  supplierId?: string;
  status?: PurchaseStatus;
  paymentStatus?: PurchasePaymentStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const purchasesApi = {
  getPurchases: (params?: PurchaseListParams) =>
    apiClient.get<{ data: Purchase[]; total: number; page: number; limit: number; totalPages: number }>('/purchases', { params }),

  getPurchaseById: (id: string) =>
    apiClient.get<Purchase>(`/purchases/${id}`),

  createPurchase: (data: CreatePurchasePayload) =>
    apiClient.post<Purchase>('/purchases', data),

  receivePurchase: (id: string) =>
    apiClient.post<Purchase>(`/purchases/${id}/receive`),

  cancelPurchase: (id: string) =>
    apiClient.post<Purchase>(`/purchases/${id}/cancel`),

  payPurchase: (id: string, data: { amount: number; paymentMethod: ExpensePaymentMethod; referenceNumber?: string; paymentDate?: string; notes?: string }) =>
    apiClient.post<Purchase>(`/purchases/${id}/pay`, data),
};
