// Washora Customer Portal Authentication API Client

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

export interface CustomerAuthResponse {
  accessToken: string;
  account: {
    id: string;
    customerId: string;
    tenantId: string;
    phone: string;
    email?: string;
    isPhoneVerified: boolean;
    status: string;
  };
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    customerCode?: string;
    pendingBalance?: number;
    totalOrders?: number;
    totalSpent?: number;
    addresses?: any[];
  } | null;
  tenant: {
    id: string;
    name: string;
    logo?: string;
    phone?: string;
    email?: string;
  } | null;
}

export const getCustomerToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('washora_customer_token');
};

export const setCustomerToken = (token: string | null) => {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('washora_customer_token', token);
  } else {
    localStorage.removeItem('washora_customer_token');
  }
};

export const getCustomerSession = (): CustomerAuthResponse | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('washora_customer_session');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setCustomerSession = (session: CustomerAuthResponse | null) => {
  if (typeof window === 'undefined') return;
  if (session) {
    localStorage.setItem('washora_customer_session', JSON.stringify(session));
  } else {
    localStorage.removeItem('washora_customer_session');
  }
};

export const clearCustomerAuth = () => {
  setCustomerToken(null);
  setCustomerSession(null);
};

export const customerAuthApi = {
  async requestOtp(phone: string, tenantSlug?: string): Promise<{ success: boolean; message: string; testOtp?: string; expiresAt?: string }> {
    const res = await fetch(`${API_BASE_URL}/customer-auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, tenantSlug }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || json.error?.message || 'Failed to request OTP');
    }
    return json.data || json;
  },

  async verifyOtp(phone: string, otp: string, tenantSlug?: string): Promise<CustomerAuthResponse> {
    const res = await fetch(`${API_BASE_URL}/customer-auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp, tenantSlug }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || json.error?.message || 'Failed to verify OTP');
    }

    const authData: CustomerAuthResponse = json.data || json;
    if (authData.accessToken) {
      setCustomerToken(authData.accessToken);
      setCustomerSession(authData);
    }
    return authData;
  },

  async getMe(): Promise<CustomerAuthResponse> {
    const token = getCustomerToken();
    if (!token) {
      throw new Error('No customer token found');
    }

    const res = await fetch(`${API_BASE_URL}/customer-auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        clearCustomerAuth();
      }
      throw new Error(json.message || json.error?.message || 'Failed to fetch customer profile');
    }

    const data: CustomerAuthResponse = {
      accessToken: token,
      ...(json.data || json),
    };
    setCustomerSession(data);
    return data;
  },

  async logout(): Promise<void> {
    const token = getCustomerToken();
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/customer-auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } finally {
      clearCustomerAuth();
    }
  },
};
