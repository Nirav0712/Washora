import { apiClient } from './client';

export interface CustomerAddressInput {
  label?: string;
  addressLine1: string;
  addressLine2?: string;
  area?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  isDefault?: boolean;
}

export interface CreateCustomerInput {
  name: string;
  phone: string;
  email?: string;
  alternatePhone?: string;
  gender?: string;
  dateOfBirth?: string;
  branchIds?: string[];
  addresses?: CustomerAddressInput[];
  address?: string; // Quick POS address field
  notes?: string;
  tags?: string[];
  isVip?: boolean;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  isActive?: boolean;
}

export interface CustomerQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  phone?: string;
  name?: string;
  isVip?: boolean;
  branchId?: string;
  isActive?: boolean;
}

export const customersApi = {
  list: (filters: CustomerQueryFilters = {}) => {
    return apiClient.get<any>('/customers', { params: filters });
  },

  search: (query: string) => {
    return apiClient.get<any[]>('/customers/search', { params: { q: query } });
  },

  getById: (id: string) => {
    return apiClient.get<any>(`/customers/${id}`);
  },

  create: (data: CreateCustomerInput) => {
    return apiClient.post<any>('/customers', data);
  },

  update: (id: string, data: UpdateCustomerInput) => {
    return apiClient.patch<any>(`/customers/${id}`, data);
  },

  delete: (id: string) => {
    return apiClient.delete<any>(`/customers/${id}`);
  },

  getOrderHistory: (id: string, pagination: { page?: number; limit?: number } = {}) => {
    return apiClient.get<any>(`/customers/${id}/orders`, { params: pagination });
  },

  getBalance: (id: string) => {
    return apiClient.get<any>(`/customers/${id}/balance`);
  },

  getOverview: (id: string) => {
    return apiClient.get<any>(`/customers/${id}/overview`);
  },

  getNotes: (id: string) => {
    return apiClient.get<any[]>(`/customers/${id}/notes`);
  },

  addNote: (id: string, data: { content: string; authorName?: string }) => {
    return apiClient.post<any>(`/customers/${id}/notes`, data);
  },

  updateNote: (id: string, noteId: string, data: { content: string }) => {
    return apiClient.patch<any>(`/customers/${id}/notes/${noteId}`, data);
  },

  deleteNote: (id: string, noteId: string) => {
    return apiClient.delete<any>(`/customers/${id}/notes/${noteId}`);
  },

  getPayments: (id: string, pagination: { page?: number; limit?: number } = {}) => {
    return apiClient.get<any>(`/customers/${id}/payments`, { params: pagination });
  },

  getInvoices: (id: string, pagination: { page?: number; limit?: number } = {}) => {
    return apiClient.get<any>(`/customers/${id}/invoices`, { params: pagination });
  },

  getPickups: (id: string) => {
    return apiClient.get<any[]>(`/customers/${id}/pickups`);
  },

  getDeliveries: (id: string) => {
    return apiClient.get<any[]>(`/customers/${id}/deliveries`);
  },

  getNotifications: (id: string, pagination: { page?: number; limit?: number } = {}) => {
    return apiClient.get<any>(`/customers/${id}/notifications`, { params: pagination });
  },

  getActivity: (id: string) => {
    return apiClient.get<any[]>(`/customers/${id}/activity`);
  },

  getAddresses: (id: string) => {
    return apiClient.get<any[]>(`/customers/${id}/addresses`);
  },

  addAddress: (id: string, data: any) => {
    return apiClient.post<any>(`/customers/${id}/addresses`, data);
  },

  updateAddress: (id: string, addressId: string, data: any) => {
    return apiClient.patch<any>(`/customers/${id}/addresses/${addressId}`, data);
  },

  deleteAddress: (id: string, addressId: string) => {
    return apiClient.delete<any>(`/customers/${id}/addresses/${addressId}`);
  },

  setDefaultAddress: (id: string, addressId: string) => {
    return apiClient.post<any>(`/customers/${id}/addresses/${addressId}/default`);
  },
};
