import { apiClient } from './client';
import { OrderStatus, PaymentMethod, PricingTier, DiscountType } from '@washora/shared';

export interface OrderItemInput {
  productId: string;
  serviceId?: string;
  pricingTier?: PricingTier;
  quantity: number;
  notes?: string;
  garmentColor?: string;
  garmentBrand?: string;
  defectsNoted?: string[];
  garments?: Array<{
    color?: string;
    brand?: string;
    condition?: string;
    stainsNoted?: string[];
    damagesNoted?: string[];
    specialInstructions?: string;
  }>;
}

export interface CreateOrderInput {
  customerId: string;
  branchId: string;
  pricingTier?: PricingTier;
  items: OrderItemInput[];
  discount?: {
    type: DiscountType;
    value: number;
  };
  notes?: string;
  internalNotes?: string;
  pickupRequired?: boolean;
  deliveryRequired?: boolean;
  expectedReadyAt?: string;
  payment?: {
    amount: number;
    method: PaymentMethod;
    referenceNumber?: string;
    notes?: string;
  };
}

export interface UpdateOrderInput {
  notes?: string;
  internalNotes?: string;
  expectedReadyAt?: string;
}

export interface OrderQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  orderNumber?: string;
  customerId?: string;
  phone?: string;
  status?: string;
  paymentStatus?: string;
  branchId?: string;
  pricingTier?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const ordersApi = {
  list: (filters: OrderQueryFilters = {}) => {
    return apiClient.get<any>('/orders', { params: filters });
  },

  getById: (id: string) => {
    return apiClient.get<any>(`/orders/${id}`);
  },

  create: (data: CreateOrderInput) => {
    return apiClient.post<any>('/orders', data);
  },

  update: (id: string, data: UpdateOrderInput) => {
    return apiClient.patch<any>(`/orders/${id}`, data);
  },

  delete: (id: string) => {
    return apiClient.delete<any>(`/orders/${id}`);
  },

  updateStatus: (id: string, status: OrderStatus, note?: string) => {
    return apiClient.post<any>(`/orders/${id}/status`, { status, note });
  },

  cancel: (id: string, reason: string) => {
    return apiClient.post<any>(`/orders/${id}/cancel`, { reason });
  },

  getTimeline: (id: string) => {
    return apiClient.get<any[]>(`/orders/${id}/timeline`);
  },

  getInvoice: (id: string) => {
    return apiClient.get<any>(`/orders/${id}/invoice`);
  },
};
