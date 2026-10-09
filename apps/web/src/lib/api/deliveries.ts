import { apiClient } from './client';
import {
  DeliveryRequest,
  DeliveryStatus,
  LogisticsPriority,
  DeliveryFailureReason,
  PaymentMethod,
  ProofOfDelivery,
  ApiResponse,
} from '@washora/shared';

export interface CreateDeliveryPayload {
  branchId: string;
  orderId: string;
  customerId?: string;
  deliveryAddressId?: string;
  deliveryAddress?: any;
  scheduledDate: string;
  scheduledTimeFrom?: string;
  scheduledTimeTo?: string;
  assignedAgentId?: string;
  priority?: LogisticsPriority;
  specialInstructions?: string;
  customerNotes?: string;
  internalNotes?: string;
}

export interface UpdateDeliveryPayload {
  scheduledDate?: string;
  scheduledTimeFrom?: string;
  scheduledTimeTo?: string;
  assignedAgentId?: string;
  priority?: LogisticsPriority;
  specialInstructions?: string;
  customerNotes?: string;
  internalNotes?: string;
  deliveryAddress?: any;
}

export interface DeliveryFilterParams {
  branchId?: string;
  customerId?: string;
  orderId?: string;
  assignedAgentId?: string;
  agentId?: string;
  status?: DeliveryStatus;
  priority?: LogisticsPriority;
  date?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const deliveriesApi = {
  list: (params?: DeliveryFilterParams) =>
    apiClient.get<ApiResponse<DeliveryRequest[]>>(
      '/deliveries',
      { params },
    ),

  getAll: (params?: DeliveryFilterParams) =>
    apiClient.get<ApiResponse<DeliveryRequest[]>>(
      '/deliveries',
      { params },
    ),

  getById: (id: string) =>
    apiClient.get<ApiResponse<DeliveryRequest>>(`/deliveries/${id}`),

  create: (data: CreateDeliveryPayload) =>
    apiClient.post<ApiResponse<DeliveryRequest>>('/deliveries', data),

  update: (id: string, data: UpdateDeliveryPayload) =>
    apiClient.patch<ApiResponse<DeliveryRequest>>(`/deliveries/${id}`, data),

  assign: (id: string, payload: { assignedAgentId?: string; agentId?: string; notes?: string } | string, notes?: string) => {
    const body = typeof payload === 'string'
      ? { assignedAgentId: payload, notes }
      : { assignedAgentId: payload.assignedAgentId || payload.agentId, notes: payload.notes };
    return apiClient.post<ApiResponse<DeliveryRequest>>(`/deliveries/${id}/assign`, body);
  },

  start: (id: string) =>
    apiClient.post<ApiResponse<DeliveryRequest>>(`/deliveries/${id}/start`),

  arrive: (id: string) =>
    apiClient.post<ApiResponse<DeliveryRequest>>(`/deliveries/${id}/arrive`),

  complete: (id: string, proof?: ProofOfDelivery) =>
    apiClient.post<ApiResponse<DeliveryRequest>>(`/deliveries/${id}/complete`, proof || {}),

  recordCollection: (id: string, payload: { amount: number; paymentMethod: PaymentMethod | string; referenceNumber?: string; notes?: string } | number, method?: PaymentMethod | string, notes?: string) => {
    const body = typeof payload === 'number'
      ? { amount: payload, paymentMethod: method || PaymentMethod.CASH, notes }
      : payload;
    return apiClient.post<ApiResponse<DeliveryRequest>>(`/deliveries/${id}/collection`, body);
  },

  saveProof: (id: string, proof: ProofOfDelivery | any) =>
    apiClient.post<ApiResponse<DeliveryRequest>>(`/deliveries/${id}/proof`, proof),

  submitProof: (id: string, proof: ProofOfDelivery | any) =>
    apiClient.post<ApiResponse<DeliveryRequest>>(`/deliveries/${id}/proof`, proof),

  fail: (id: string, payload: { reason: DeliveryFailureReason | string; note?: string; notes?: string } | DeliveryFailureReason | string, notes?: string) => {
    const body = typeof payload === 'string'
      ? { reason: payload, note: notes || '' }
      : { reason: payload.reason, note: payload.note || payload.notes || '' };
    return apiClient.post<ApiResponse<DeliveryRequest>>(`/deliveries/${id}/fail`, body);
  },

  reschedule: (id: string, payload: { scheduledDate?: string; newDate?: string; scheduledTimeFrom?: string; newTimeFrom?: string; scheduledTimeTo?: string; newTimeTo?: string; reason?: string }) => {
    const body = {
      scheduledDate: payload.scheduledDate || payload.newDate,
      scheduledTimeFrom: payload.scheduledTimeFrom || payload.newTimeFrom,
      scheduledTimeTo: payload.scheduledTimeTo || payload.newTimeTo,
      reason: payload.reason,
    };
    return apiClient.post<ApiResponse<DeliveryRequest>>(`/deliveries/${id}/reschedule`, body);
  },

  cancel: (id: string, payload: { reason: string } | string) => {
    const body = typeof payload === 'string' ? { reason: payload } : payload;
    return apiClient.post<ApiResponse<DeliveryRequest>>(`/deliveries/${id}/cancel`, body);
  },
};
