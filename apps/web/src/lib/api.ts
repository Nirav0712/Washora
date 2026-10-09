const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Seed
  seedDatabase: () => fetcher<{ message: string; counts: Record<string, number> }>('/seed'),

  // Tenants
  getTenants: () => fetcher<any[]>('/tenants'),
  getTenantById: (id: string) => fetcher<any>(`/tenants/${id}`),

  // Branches
  getBranches: (tenantId?: string) =>
    fetcher<any[]>(`/branches${tenantId ? `?tenantId=${tenantId}` : ''}`),
  getBranchById: (id: string) => fetcher<any>(`/branches/${id}`),
  createBranch: (data: any) =>
    fetcher<any>('/branches', { method: 'POST', body: JSON.stringify(data) }),
  updateBranch: (id: string, data: any) =>
    fetcher<any>(`/branches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Categories
  getCategories: (tenantId?: string) =>
    fetcher<any[]>(`/categories${tenantId ? `?tenantId=${tenantId}` : ''}`),
  createCategory: (data: any) =>
    fetcher<any>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: any) =>
    fetcher<any>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) =>
    fetcher<any>(`/categories/${id}`, { method: 'DELETE' }),

  // Products
  getProducts: (params?: { tenantId?: string; categoryId?: string; branchId?: string }) => {
    const query = new URLSearchParams();
    if (params?.tenantId) query.set('tenantId', params.tenantId);
    if (params?.categoryId) query.set('categoryId', params.categoryId);
    if (params?.branchId) query.set('branchId', params.branchId);
    const qs = query.toString();
    return fetcher<any[]>(`/products${qs ? `?${qs}` : ''}`);
  },
  createProduct: (data: any) =>
    fetcher<any>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) =>
    fetcher<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) =>
    fetcher<any>(`/products/${id}`, { method: 'DELETE' }),

  // Customers
  getCustomers: (params?: { tenantId?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.tenantId) query.set('tenantId', params.tenantId);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return fetcher<any[]>(`/customers${qs ? `?${qs}` : ''}`);
  },
  createCustomer: (data: any) =>
    fetcher<any>('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id: string, data: any) =>
    fetcher<any>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Orders
  getOrders: (params?: { tenantId?: string; branchId?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.tenantId) query.set('tenantId', params.tenantId);
    if (params?.branchId) query.set('branchId', params.branchId);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return fetcher<any[]>(`/orders${qs ? `?${qs}` : ''}`);
  },
  getOrderById: (id: string) => fetcher<any>(`/orders/${id}`),
  createOrder: (data: any) =>
    fetcher<any>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id: string, status: string, note?: string) =>
    fetcher<any>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note }),
    }),
  recordPayment: (id: string, amount: number, method: string, reference?: string) =>
    fetcher<any>(`/orders/${id}/payment`, {
      method: 'PUT',
      body: JSON.stringify({ amount, method, reference }),
    }),

  // Reports & Analytics
  getReportDashboard: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return fetcher<any>(`/reports/dashboard${qs ? `?${qs}` : ''}`);
  },
  getSalesReport: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return fetcher<any>(`/reports/sales${qs ? `?${qs}` : ''}`);
  },
  getOrdersReport: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return fetcher<any>(`/reports/orders${qs ? `?${qs}` : ''}`);
  },
  getCustomersReport: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return fetcher<any>(`/reports/customers${qs ? `?${qs}` : ''}`);
  },
  getServicesReport: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return fetcher<any>(`/reports/services${qs ? `?${qs}` : ''}`);
  },
  getBranchesReport: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return fetcher<any>(`/reports/branches${qs ? `?${qs}` : ''}`);
  },
  getPaymentsReport: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return fetcher<any>(`/reports/payments${qs ? `?${qs}` : ''}`);
  },
  getFinanceReport: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return fetcher<any>(`/reports/finance${qs ? `?${qs}` : ''}`);
  },
  getExpensesReport: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return fetcher<any>(`/reports/expenses${qs ? `?${qs}` : ''}`);
  },
  getInventoryReport: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return fetcher<any>(`/reports/inventory${qs ? `?${qs}` : ''}`);
  },
  getSuppliersReport: () => fetcher<any>('/reports/suppliers'),
  getProcessingReport: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return fetcher<any>(`/reports/processing${qs ? `?${qs}` : ''}`);
  },
  getQcReport: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return fetcher<any>(`/reports/qc${qs ? `?${qs}` : ''}`);
  },
  getStaffReport: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return fetcher<any>(`/reports/staff${qs ? `?${qs}` : ''}`);
  },
  getLogisticsReport: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return fetcher<any>(`/reports/logistics${qs ? `?${qs}` : ''}`);
  },
  getNotificationsReport: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return fetcher<any>(`/reports/notifications${qs ? `?${qs}` : ''}`);
  },
};

