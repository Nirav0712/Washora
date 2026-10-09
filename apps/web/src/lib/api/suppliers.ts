import { apiClient } from './client';
import { Supplier, SupplierPayment, ExpensePaymentMethod } from '@washora/shared';

export interface CreateSupplierPayload {
  businessName: string;
  contactPerson?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  gstNumber?: string;
  address?: string;
  categories?: string[];
  openingBalance?: number;
  paymentTerms?: string;
  notes?: string;
  isActive?: boolean;
}

export interface RecordSupplierPaymentPayload {
  supplierId: string;
  branchId?: string;
  amount: number;
  paymentMethod: ExpensePaymentMethod;
  referenceNumber?: string;
  paymentDate?: string;
  purchaseId?: string;
  notes?: string;
}

export interface SupplierListParams {
  search?: string;
  category?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const suppliersApi = {
  getSuppliers: (params?: SupplierListParams) =>
    apiClient.get<{ data: Supplier[]; total: number; page: number; limit: number; totalPages: number }>('/suppliers', { params }),

  getSupplierById: (id: string) =>
    apiClient.get<Supplier>(`/suppliers/${id}`),

  createSupplier: (data: CreateSupplierPayload) =>
    apiClient.post<Supplier>('/suppliers', data),

  updateSupplier: (id: string, data: Partial<CreateSupplierPayload>) =>
    apiClient.put<Supplier>(`/suppliers/${id}`, data),

  deleteSupplier: (id: string) =>
    apiClient.delete<{ success: boolean; message: string }>(`/suppliers/${id}`),

  getSupplierLedger: (id: string) =>
    apiClient.get<any>(`/suppliers/${id}/ledger`),

  recalculateBalance: (id: string) =>
    apiClient.post<{ success: boolean; currentBalance: number }>(`/suppliers/${id}/recalculate-balance`),

  // Supplier Payments
  getPayments: (params?: { supplierId?: string; branchId?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) =>
    apiClient.get<{ data: SupplierPayment[]; total: number; page: number; limit: number; totalPages: number }>('/suppliers/payments', { params }),

  recordPayment: (data: RecordSupplierPaymentPayload) =>
    apiClient.post<SupplierPayment>('/suppliers/payments', data),
};
