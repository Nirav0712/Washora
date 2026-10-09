// Washora Central API Client
// Handles baseURL, JWT tokens, header injection, x-branch-id, refresh flows and error contracts

export interface ApiClientOptions extends RequestInit {
  params?: Record<string, any>;
  skipAuth?: boolean;
}

export class ApiError extends Error {
  code: string;
  details?: any;
  status: number;

  constructor(message: string, code = 'API_ERROR', status = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiClient {
  private accessToken: string | null = null;
  private currentBranchId: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('washora_access_token');
      this.currentBranchId = localStorage.getItem('washora_active_branch_id');
    }
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('washora_access_token', token);
      } else {
        localStorage.removeItem('washora_access_token');
      }
    }
  }

  getAccessToken(): string | null {
    if (!this.accessToken && typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('washora_access_token');
    }
    return this.accessToken;
  }

  setActiveBranchId(branchId: string | null) {
    this.currentBranchId = branchId;
    if (typeof window !== 'undefined') {
      if (branchId) {
        localStorage.setItem('washora_active_branch_id', branchId);
      } else {
        localStorage.removeItem('washora_active_branch_id');
      }
    }
  }

  getActiveBranchId(): string | null {
    if (!this.currentBranchId && typeof window !== 'undefined') {
      this.currentBranchId = localStorage.getItem('washora_active_branch_id');
    }
    return this.currentBranchId;
  }

  private subscribeTokenRefresh(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    const refreshToken = localStorage.getItem('washora_refresh_token');
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        this.clearAuth();
        return null;
      }

      const json = await res.json();
      const tokens = json.data || json;
      if (tokens.accessToken) {
        this.setAccessToken(tokens.accessToken);
        if (tokens.refreshToken) {
          localStorage.setItem('washora_refresh_token', tokens.refreshToken);
        }
        return tokens.accessToken;
      }
    } catch {
      this.clearAuth();
    }
    return null;
  }

  clearAuth() {
    this.accessToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('washora_access_token');
      localStorage.removeItem('washora_refresh_token');
      localStorage.removeItem('washora_active_branch_id');
    }
  }

  async request<T = any>(endpoint: string, options: ApiClientOptions = {}): Promise<T> {
    const { params, skipAuth, headers: customHeaders, ...fetchOptions } = options;

    let url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(customHeaders as Record<string, string>),
    };

    const token = this.getAccessToken();
    if (!skipAuth && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const branchId = this.getActiveBranchId();
    if (branchId) {
      headers['x-branch-id'] = branchId;
    }

    let response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Handle token expiration & automatic refresh
    if (response.status === 401 && !skipAuth && typeof window !== 'undefined') {
      const refreshToken = localStorage.getItem('washora_refresh_token');
      if (refreshToken && !this.isRefreshing) {
        this.isRefreshing = true;
        const newToken = await this.refreshAccessToken();
        this.isRefreshing = false;

        if (newToken) {
          this.onRefreshed(newToken);
          headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, { ...fetchOptions, headers });
        }
      }
    }

    let json: any;
    try {
      json = await response.json();
    } catch {
      json = null;
    }

    if (!response.ok) {
      const errorMsg = json?.error?.message || json?.message || 'Request failed';
      const errorCode = json?.error?.code || 'HTTP_ERROR';
      const errorDetails = json?.error?.details || null;
      throw new ApiError(errorMsg, errorCode, response.status, errorDetails);
    }

    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      return (json.meta ? { data: json.data, meta: json.meta } : json.data) as T;
    }

    return json as T;
  }

  get<T = any>(endpoint: string, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T = any>(endpoint: string, body?: any, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T = any>(endpoint: string, body?: any, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T = any>(endpoint: string, body?: any, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T = any>(endpoint: string, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
