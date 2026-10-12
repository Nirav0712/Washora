const defaultApiUrl = process.env.NODE_ENV === 'production'
  ? 'https://deeppink-ibis-194201.hostingersite.com/api'
  : 'http://localhost:4000/api';

function resolveApiBaseUrl(configuredUrl?: string): string {
  if (!configuredUrl) return defaultApiUrl;
  const trimmed = configuredUrl.trim().replace(/\/+$/, '');
  if (trimmed.startsWith('/') || trimmed.endsWith('/api')) {
    return trimmed;
  }
  return `${trimmed}/api`;
}

const API_BASE = resolveApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);

export class AdminApiClient {
  private static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('washora_admin_token');
  }

  private static async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.message || `Request failed with status ${response.status}`;
      throw new Error(Array.isArray(message) ? message.join(', ') : message);
    }

    const json = await response.json();
    return json.data !== undefined ? json.data : json;
  }

  // ==========================================
  // AUTH
  // ==========================================
  static async login(credentials: { email: string; password: string }) {
    return this.request('/platform/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  static async getMe() {
    return this.request('/platform/auth/me');
  }

  static async updateMe(data: any) {
    return this.request('/platform/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async listAdminUsers() {
    return this.request('/platform/auth/users');
  }

  static async createAdminUser(data: any) {
    return this.request('/platform/auth/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ==========================================
  // DASHBOARD & SYSTEM HEALTH
  // ==========================================
  static async getDashboard() {
    return this.request('/platform/dashboard');
  }

  static async getSystemHealth() {
    return this.request('/platform/system-health');
  }

  // ==========================================
  // TENANTS
  // ==========================================
  static async listTenants(params: { page?: number; limit?: number; search?: string; status?: string } = {}) {
    const q = new URLSearchParams();
    if (params.page) q.append('page', params.page.toString());
    if (params.limit) q.append('limit', params.limit.toString());
    if (params.search) q.append('search', params.search);
    if (params.status) q.append('status', params.status);
    return this.request(`/platform/tenants?${q.toString()}`);
  }

  static async getTenant(id: string) {
    return this.request(`/platform/tenants/${id}`);
  }

  static async provisionTenant(data: any) {
    return this.request('/platform/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateTenant(id: string, data: any) {
    return this.request(`/platform/tenants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async verifyTenant(id: string, isVerified: boolean = true) {
    return this.request(`/platform/tenants/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ isVerified }),
    });
  }

  static async activateTenant(id: string, reason: string) {
    return this.request(`/platform/tenants/${id}/activate`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  static async suspendTenant(id: string, reason: string) {
    return this.request(`/platform/tenants/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  static async cancelTenant(id: string, reason: string) {
    return this.request(`/platform/tenants/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  static async archiveTenant(id: string, reason: string) {
    return this.request(`/platform/tenants/${id}/archive`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  static async impersonateTenant(id: string) {
    return this.request(`/platform/tenants/${id}/impersonate`, {
      method: 'POST',
    });
  }

  static async resetTenantPassword(id: string) {
    return this.request(`/platform/tenants/${id}/reset-password`, {
      method: 'POST',
    });
  }

  // ==========================================
  // PLANS
  // ==========================================
  static async listPlans() {
    return this.request('/platform/plans');
  }

  static async getPlan(id: string) {
    return this.request(`/platform/plans/${id}`);
  }

  static async createPlan(data: any) {
    return this.request('/platform/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updatePlan(id: string, data: any) {
    return this.request(`/platform/plans/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async archivePlan(id: string) {
    return this.request(`/platform/plans/${id}/archive`, {
      method: 'POST',
    });
  }

  // ==========================================
  // SUBSCRIPTIONS
  // ==========================================
  static async listSubscriptions(params: { page?: number; limit?: number; status?: string } = {}) {
    const q = new URLSearchParams();
    if (params.page) q.append('page', params.page.toString());
    if (params.limit) q.append('limit', params.limit.toString());
    if (params.status) q.append('status', params.status);
    return this.request(`/platform/subscriptions?${q.toString()}`);
  }

  static async getSubscription(id: string) {
    return this.request(`/platform/subscriptions/${id}`);
  }

  static async getSubscriptionHistory(id: string) {
    return this.request(`/platform/subscriptions/${id}/history`);
  }

  static async changeSubscriptionPlan(id: string, data: { newPlanId: string; billingInterval?: string; reason?: string }) {
    return this.request(`/platform/subscriptions/${id}/change-plan`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async convertTrial(id: string, billingInterval?: string) {
    return this.request(`/platform/subscriptions/${id}/convert-trial`, {
      method: 'POST',
      body: JSON.stringify({ billingInterval }),
    });
  }

  static async cancelSubscription(id: string, immediate: boolean = false, reason?: string) {
    return this.request(`/platform/subscriptions/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ immediate, reason }),
    });
  }

  static async reactivateSubscription(id: string) {
    return this.request(`/platform/subscriptions/${id}/reactivate`, {
      method: 'POST',
    });
  }

  // ==========================================
  // BILLING
  // ==========================================
  static async listInvoices(params: { page?: number; limit?: number; status?: string } = {}) {
    const q = new URLSearchParams();
    if (params.page) q.append('page', params.page.toString());
    if (params.limit) q.append('limit', params.limit.toString());
    if (params.status) q.append('status', params.status);
    return this.request(`/platform/billing/invoices?${q.toString()}`);
  }

  static async getInvoice(id: string) {
    return this.request(`/platform/billing/invoices/${id}`);
  }

  static async createInvoice(data: any) {
    return this.request('/platform/billing/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async listPayments(params: { page?: number; limit?: number } = {}) {
    const q = new URLSearchParams();
    if (params.page) q.append('page', params.page.toString());
    if (params.limit) q.append('limit', params.limit.toString());
    return this.request(`/platform/billing/payments?${q.toString()}`);
  }

  static async recordPayment(data: any) {
    return this.request('/platform/billing/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getBillingOverview() {
    return this.request('/platform/billing/overview');
  }

  // ==========================================
  // USAGE & AUDIT
  // ==========================================
  static async getAllUsage() {
    return this.request('/platform/usage');
  }

  static async getTenantUsage(tenantId: string) {
    return this.request(`/platform/usage/${tenantId}`);
  }

  static async listAuditLogs(params: { action?: string; page?: number; limit?: number } = {}) {
    const q = new URLSearchParams();
    if (params.action) q.append('action', params.action);
    if (params.page) q.append('page', params.page.toString());
    if (params.limit) q.append('limit', params.limit.toString());
    return this.request(`/platform/audit?${q.toString()}`);
  }
}
