import { apiClient } from './client';
import { Expense, ExpenseCategory, ExpenseStatus, ExpensePaymentMethod } from '@washora/shared';

export interface CreateExpenseCategoryPayload {
  name: string;
  code: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface CreateExpensePayload {
  branchId?: string;
  categoryId: string;
  title: string;
  description?: string;
  amount: number;
  expenseDate?: string;
  paymentMethod?: ExpensePaymentMethod;
  supplierId?: string;
  referenceNumber?: string;
  notes?: string;
}

export interface ExpenseListParams {
  branchId?: string;
  categoryId?: string;
  status?: ExpenseStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const expensesApi = {
  // Categories
  getCategories: () =>
    apiClient.get<ExpenseCategory[]>('/expenses/categories'),

  createCategory: (data: CreateExpenseCategoryPayload) =>
    apiClient.post<ExpenseCategory>('/expenses/categories', data),

  updateCategory: (id: string, data: Partial<CreateExpenseCategoryPayload> & { isActive?: boolean }) =>
    apiClient.patch<ExpenseCategory>(`/expenses/categories/${id}`, data),

  // Expenses
  getExpenses: (params?: ExpenseListParams) =>
    apiClient.get<{ items: Expense[]; total: number; page: number; limit: number; totalPages: number }>('/expenses', { params }),

  getExpenseById: (id: string) =>
    apiClient.get<Expense>(`/expenses/${id}`),

  createExpense: (data: CreateExpensePayload) =>
    apiClient.post<Expense>('/expenses', data),

  updateExpense: (id: string, data: Partial<CreateExpensePayload>) =>
    apiClient.patch<Expense>(`/expenses/${id}`, data),

  approveExpense: (id: string) =>
    apiClient.post<Expense>(`/expenses/${id}/approve`),

  rejectExpense: (id: string, reason?: string) =>
    apiClient.post<Expense>(`/expenses/${id}/reject`, { reason }),

  payExpense: (id: string, data?: { paymentMethod?: ExpensePaymentMethod; referenceNumber?: string }) =>
    apiClient.post<Expense>(`/expenses/${id}/pay`, data),

  deleteExpense: (id: string) =>
    apiClient.delete<{ message: string }>(`/expenses/${id}`),
};
