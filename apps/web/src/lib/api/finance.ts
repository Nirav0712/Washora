import { apiClient } from './client';

export interface FinanceDashboardSummary {
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    totalReceivables: number;
    totalPayables: number;
    inventoryValuation: number;
  };
  recentPayments: any[];
  recentExpenses: any[];
}

export interface FinanceReportParams {
  branchId?: string;
  startDate?: string;
  endDate?: string;
}

export const financeApi = {
  getDashboard: (branchId?: string) =>
    apiClient.get<FinanceDashboardSummary>('/finance/dashboard', { params: { branchId } }),

  getRevenueReport: (params?: FinanceReportParams) =>
    apiClient.get<any>('/finance/reports/revenue', { params }),

  getExpenseReport: (params?: FinanceReportParams) =>
    apiClient.get<any>('/finance/reports/expenses', { params }),

  getProfitLossReport: (params?: FinanceReportParams) =>
    apiClient.get<any>('/finance/reports/profit-loss', { params }),
};
