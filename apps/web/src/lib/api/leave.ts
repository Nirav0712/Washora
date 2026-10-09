import { apiClient } from './client';
import { LeaveType, LeaveRequest } from '@washora/shared';

export interface LeaveListResponse {
  items: LeaveRequest[];
  total: number;
  page: number;
  limit: number;
}

export const leaveApi = {
  getLeaveTypes: () => {
    return apiClient.get<LeaveType[]>('/api/leave/types');
  },

  createLeaveType: (data: any) => {
    return apiClient.post<LeaveType>('/api/leave/types', data);
  },

  updateLeaveType: (id: string, data: any) => {
    return apiClient.patch<LeaveType>(`/api/leave/types/${id}`, data);
  },

  getLeaveRequests: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    staffId?: string;
    branchId?: string;
    startDate?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.staffId) query.append('staffId', params.staffId);
    if (params?.branchId) query.append('branchId', params.branchId);
    if (params?.startDate) query.append('startDate', params.startDate);
    const qs = query.toString();
    return apiClient.get<LeaveListResponse>(`/api/leave/requests${qs ? `?${qs}` : ''}`);
  },

  getLeaveRequestById: (id: string) => {
    return apiClient.get<LeaveRequest>(`/api/leave/requests/${id}`);
  },

  createLeaveRequest: (data: any) => {
    return apiClient.post<LeaveRequest>('/api/leave/requests', data);
  },

  approveLeave: (id: string) => {
    return apiClient.patch<LeaveRequest>(`/api/leave/requests/${id}/approve`);
  },

  rejectLeave: (id: string, rejectionReason: string) => {
    return apiClient.patch<LeaveRequest>(`/api/leave/requests/${id}/reject`, { rejectionReason });
  },

  cancelLeave: (id: string) => {
    return apiClient.patch<LeaveRequest>(`/api/leave/requests/${id}/cancel`);
  },
};
