import { apiClient } from './client';
import { ShiftDefinition, ShiftAssignment } from '@washora/shared';

export const shiftsApi = {
  getShifts: (branchId?: string) => {
    return apiClient.get<ShiftDefinition[]>(`/api/shifts${branchId ? `?branchId=${branchId}` : ''}`);
  },

  getShiftById: (id: string) => {
    return apiClient.get<ShiftDefinition>(`/api/shifts/${id}`);
  },

  createShift: (data: any) => {
    return apiClient.post<ShiftDefinition>('/api/shifts', data);
  },

  updateShift: (id: string, data: any) => {
    return apiClient.patch<ShiftDefinition>(`/api/shifts/${id}`, data);
  },

  deleteShift: (id: string) => {
    return apiClient.delete<ShiftDefinition>(`/api/shifts/${id}`);
  },

  getAssignments: (params?: { branchId?: string; staffId?: string; date?: string }) => {
    const query = new URLSearchParams();
    if (params?.branchId) query.append('branchId', params.branchId);
    if (params?.staffId) query.append('staffId', params.staffId);
    if (params?.date) query.append('date', params.date);
    const qs = query.toString();
    return apiClient.get<ShiftAssignment[]>(`/api/shifts/assignments${qs ? `?${qs}` : ''}`);
  },

  assignShift: (data: any) => {
    return apiClient.post<ShiftAssignment>('/api/shifts/assignments', data);
  },

  deleteAssignment: (id: string) => {
    return apiClient.delete<{ success: boolean }>(`/api/shifts/assignments/${id}`);
  },
};
