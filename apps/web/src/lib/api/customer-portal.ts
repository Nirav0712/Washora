// Customer Portal API Client
import { getCustomerToken, clearCustomerAuth } from './customer-auth';

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

const API_BASE_URL = resolveApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);

async function customerFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getCustomerToken();
  if (!token) {
    throw new Error('Not authenticated as customer');
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}/customer-portal${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let json: any;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearCustomerAuth();
    }
    const errorMsg = json?.error?.message || json?.message || 'Customer request failed';
    throw new Error(errorMsg);
  }

  if (json && typeof json === 'object' && 'data' in json) {
    return (json.meta ? { data: json.data, meta: json.meta } : json.data) as T;
  }

  return json as T;
}

export const customerPortalApi = {
  // Dashboard
  async getDashboard() {
    return customerFetch('/dashboard');
  },

  // Profile
  async getProfile() {
    return customerFetch('/profile');
  },

  async updateProfile(data: { name?: string; email?: string; preferredLanguage?: string }) {
    return customerFetch('/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Addresses
  async getAddresses() {
    return customerFetch('/addresses');
  },

  async addAddress(data: any) {
    return customerFetch('/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAddress(addressId: string, data: any) {
    return customerFetch(`/addresses/${addressId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteAddress(addressId: string) {
    return customerFetch(`/addresses/${addressId}`, {
      method: 'DELETE',
    });
  },

  async setDefaultAddress(addressId: string) {
    return customerFetch(`/addresses/${addressId}/default`, {
      method: 'POST',
    });
  },

  // Orders
  async getOrders(params: { page?: number; limit?: number; status?: string } = {}) {
    const sp = new URLSearchParams();
    if (params.page) sp.set('page', String(params.page));
    if (params.limit) sp.set('limit', String(params.limit));
    if (params.status && params.status !== 'ALL') sp.set('status', params.status);
    const qs = sp.toString();
    return customerFetch(`/orders${qs ? `?${qs}` : ''}`);
  },

  async getOrderById(orderId: string) {
    return customerFetch(`/orders/${orderId}`);
  },

  // Payments
  async getPayments(params: { page?: number; limit?: number } = {}) {
    const sp = new URLSearchParams();
    if (params.page) sp.set('page', String(params.page));
    if (params.limit) sp.set('limit', String(params.limit));
    const qs = sp.toString();
    return customerFetch(`/payments${qs ? `?${qs}` : ''}`);
  },

  // Invoices
  async getInvoices() {
    return customerFetch('/invoices');
  },

  async getInvoiceById(orderId: string) {
    return customerFetch(`/invoices/${orderId}`);
  },

  // Notifications
  async getNotifications(params: { page?: number; limit?: number } = {}) {
    const sp = new URLSearchParams();
    if (params.page) sp.set('page', String(params.page));
    if (params.limit) sp.set('limit', String(params.limit));
    const qs = sp.toString();
    return customerFetch(`/notifications${qs ? `?${qs}` : ''}`);
  },

  // Preferences
  async getPreferences() {
    return customerFetch('/preferences');
  },

  async updatePreferences(data: any) {
    return customerFetch('/preferences', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
