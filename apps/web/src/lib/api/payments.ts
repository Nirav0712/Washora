import { apiClient } from './client';
import { PaymentMethod } from '@washora/shared';

export interface CreatePaymentInput {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
}

export interface RefundPaymentInput {
  amount: number;
  reason: string;
  referenceNumber?: string;
}

export interface PaymentQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  method?: string;
  status?: string;
  branchId?: string;
  customerId?: string;
  orderId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const paymentsApi = {
  list: (filters: PaymentQueryFilters = {}) => {
    return apiClient.get<any>('/payments', { params: filters });
  },

  getById: (id: string) => {
    return apiClient.get<any>(`/payments/${id}`);
  },

  getByOrder: (orderId: string) => {
    return apiClient.get<any[]>(`/orders/${orderId}/payments`);
  },

  create: (data: CreatePaymentInput) => {
    return apiClient.post<any>('/payments', data);
  },

  refund: (id: string, data: RefundPaymentInput) => {
    return apiClient.post<any>(`/payments/${id}/refund`, data);
  },
};
