import { apiClient } from './client';
import {
  PickupRequest,
  PickupStatus,
  LogisticsPriority,
  PickupFailureReason,
  ApiResponse,
} from '@washora/shared';

export interface CreatePickupPayload {
  branchId: string;
  customerId: string;
  orderId?: string;
  pickupAddressId?: string;
  pickupAddress?: any;
  scheduledDate: string;
  scheduledTimeFrom?: string;
  scheduledTimeTo?: string;
  assignedAgentId?: string;
  priority?: LogisticsPriority;
  specialInstructions?: string;
  customerNotes?: string;
  internalNotes?: string;
}

export interface UpdatePickupPayload {
  scheduledDate?: string;
  scheduledTimeFrom?: string;
  scheduledTimeTo?: string;
  assignedAgentId?: string;
  priority?: LogisticsPriority;
  specialInstructions?: string;
  customerNotes?: string;
  internalNotes?: string;
  pickupAddress?: any;
}

export interface PickupFilterParams {
  branchId?: string;
  customerId?: string;
  orderId?: string;
  assignedAgentId?: string;
  agentId?: string;
  status?: PickupStatus;
  priority?: LogisticsPriority;
  date?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const pickupsApi = {
  list: (params?: PickupFilterParams) =>
    apiClient.get<ApiResponse<PickupRequest[]>>(
      '/pickups',
      { params },
    ),

  getAll: (params?: PickupFilterParams) =>
    apiClient.get<ApiResponse<PickupRequest[]>>(
      '/pickups',
      { params },
    ),

  getById: (id: string) =>
    apiClient.get<ApiResponse<PickupRequest>>(`/pickups/${id}`),

  create: (data: CreatePickupPayload) =>
    apiClient.post<ApiResponse<PickupRequest>>('/pickups', data),

  update: (id: string, data: UpdatePickupPayload) =>
    apiClient.patch<ApiResponse<PickupRequest>>(`/pickups/${id}`, data),

  assign: (id: string, payload: { assignedAgentId?: string; agentId?: string; notes?: string } | string, notes?: string) => {
    const body = typeof payload === 'string'
      ? { assignedAgentId: payload, notes }
      : { assignedAgentId: payload.assignedAgentId || payload.agentId, notes: payload.notes };
    return apiClient.post<ApiResponse<PickupRequest>>(`/pickups/${id}/assign`, body);
  },

  start: (id: string) =>
    apiClient.post<ApiResponse<PickupRequest>>(`/pickups/${id}/start`),

  arrive: (id: string) =>
    apiClient.post<ApiResponse<PickupRequest>>(`/pickups/${id}/arrive`),

  complete: (id: string) =>
    apiClient.post<ApiResponse<PickupRequest>>(`/pickups/${id}/complete`),

  fail: (id: string, payload: { reason: PickupFailureReason | string; note?: string; notes?: string } | PickupFailureReason | string, notes?: string) => {
    const body = typeof payload === 'string'
      ? { reason: payload, note: notes || '' }
      : { reason: payload.reason, note: payload.note || payload.notes || '' };
    return apiClient.post<ApiResponse<PickupRequest>>(`/pickups/${id}/fail`, body);
  },

  reschedule: (id: string, payload: { scheduledDate?: string; newDate?: string; scheduledTimeFrom?: string; newTimeFrom?: string; scheduledTimeTo?: string; newTimeTo?: string; reason?: string }) => {
    const body = {
      scheduledDate: payload.scheduledDate || payload.newDate,
      scheduledTimeFrom: payload.scheduledTimeFrom || payload.newTimeFrom,
      scheduledTimeTo: payload.scheduledTimeTo || payload.newTimeTo,
      reason: payload.reason,
    };
    return apiClient.post<ApiResponse<PickupRequest>>(`/pickups/${id}/reschedule`, body);
  },

  cancel: (id: string, payload: { reason: string } | string) => {
    const body = typeof payload === 'string' ? { reason: payload } : payload;
    return apiClient.post<ApiResponse<PickupRequest>>(`/pickups/${id}/cancel`, body);
  },
};
