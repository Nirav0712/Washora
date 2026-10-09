import { apiClient } from './client';
import { StaffProfile, StaffWorkSummary, SalaryRecord } from '@washora/shared';

export interface StaffListResponse {
  items: StaffProfile[];
  total: number;
  page: number;
  limit: number;
}

export const staffApi = {
  getStaff: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    branchId?: string;
    status?: string;
    employmentType?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.branchId) query.append('branchId', params.branchId);
    if (params?.status) query.append('status', params.status);
    if (params?.employmentType) query.append('employmentType', params.employmentType);
    const qs = query.toString();
    return apiClient.get<StaffListResponse>(`/api/staff${qs ? `?${qs}` : ''}`);
  },

  getStaffById: (id: string) => {
    return apiClient.get<StaffProfile>(`/api/staff/${id}`);
  },

  createStaff: (data: any) => {
    return apiClient.post<StaffProfile>('/api/staff', data);
  },

  updateStaff: (id: string, data: any) => {
    return apiClient.patch<StaffProfile>(`/api/staff/${id}`, data);
  },

  deactivateStaff: (id: string) => {
    return apiClient.delete<StaffProfile>(`/api/staff/${id}`);
  },

  getWorkSummary: (id: string) => {
    return apiClient.get<StaffWorkSummary>(`/api/staff/${id}/work-summary`);
  },

  getSalaryHistory: (id: string) => {
    return apiClient.get<SalaryRecord[]>(`/api/staff/${id}/salary`);
  },

  createSalaryRecord: (id: string, data: any) => {
    return apiClient.post<SalaryRecord>(`/api/staff/${id}/salary`, data);
  },
};
