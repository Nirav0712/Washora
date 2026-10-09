import { apiClient } from './client';
import { AttendanceRecord } from '@washora/shared';

export interface AttendanceListResponse {
  items: AttendanceRecord[];
  total: number;
  page: number;
  limit: number;
}

export const attendanceApi = {
  checkIn: (data: { branchId: string; notes?: string; source?: string }) => {
    return apiClient.post<AttendanceRecord>('/api/attendance/check-in', data);
  },

  checkOut: (data?: { notes?: string }) => {
    return apiClient.post<AttendanceRecord>('/api/attendance/check-out', data || {});
  },

  getAttendance: (params?: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    staffId?: string;
    branchId?: string;
    status?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.dateFrom) query.append('dateFrom', params.dateFrom);
    if (params?.dateTo) query.append('dateTo', params.dateTo);
    if (params?.staffId) query.append('staffId', params.staffId);
    if (params?.branchId) query.append('branchId', params.branchId);
    if (params?.status) query.append('status', params.status);
    const qs = query.toString();
    return apiClient.get<AttendanceListResponse>(`/api/attendance${qs ? `?${qs}` : ''}`);
  },

  getAttendanceById: (id: string) => {
    return apiClient.get<AttendanceRecord>(`/api/attendance/${id}`);
  },

  correctAttendance: (id: string, data: any) => {
    return apiClient.patch<AttendanceRecord>(`/api/attendance/${id}`, data);
  },
};
