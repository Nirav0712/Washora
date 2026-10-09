import { apiClient } from './client';
import { PayrollPeriod, PayrollRecord, SalaryAdvance } from '@washora/shared';

export const payrollApi = {
  getPayrollPeriods: () => {
    return apiClient.get<PayrollPeriod[]>('/api/payroll/periods');
  },

  getPayrollPeriodById: (id: string) => {
    return apiClient.get<PayrollPeriod>(`/api/payroll/periods/${id}`);
  },

  createPayrollPeriod: (data: { name: string; startDate: string; endDate: string }) => {
    return apiClient.post<PayrollPeriod>('/api/payroll/periods', data);
  },

  processPayrollPeriod: (id: string) => {
    return apiClient.post<PayrollPeriod>(`/api/payroll/periods/${id}/process`, {});
  },

  approvePayrollPeriod: (id: string) => {
    return apiClient.post<PayrollPeriod>(`/api/payroll/periods/${id}/approve`, {});
  },

  getPayrollRecords: (periodId: string) => {
    return apiClient.get<PayrollRecord[]>(`/api/payroll/periods/${periodId}/records`);
  },

  getSalaryAdvances: (params?: { staffId?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.staffId) query.append('staffId', params.staffId);
    if (params?.status) query.append('status', params.status);
    const qs = query.toString();
    return apiClient.get<SalaryAdvance[]>(`/api/payroll/advances${qs ? `?${qs}` : ''}`);
  },

  createSalaryAdvance: (data: { staffId: string; amount: number; reason: string; requestedDate?: string }) => {
    return apiClient.post<SalaryAdvance>('/api/payroll/advances', data);
  },

  approveSalaryAdvance: (id: string, deductFromPayrollPeriodId?: string) => {
    return apiClient.patch<SalaryAdvance>(`/api/payroll/advances/${id}/approve`, { deductFromPayrollPeriodId });
  },

  rejectSalaryAdvance: (id: string, rejectionReason: string) => {
    return apiClient.patch<SalaryAdvance>(`/api/payroll/advances/${id}/reject`, { rejectionReason });
  },
};
