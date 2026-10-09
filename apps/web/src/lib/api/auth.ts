import { apiClient } from './client';
import { AuthResponse, BusinessType } from '@washora/shared';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  tenantName: string;
  businessType?: BusinessType;
  branchName?: string;
  branchCity?: string;
  gstNumber?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  tenantSlug?: string;
  tenantId?: string;
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/register', payload, { skipAuth: true });
    if (res.accessToken) {
      apiClient.setAccessToken(res.accessToken);
      if (res.refreshToken && typeof window !== 'undefined') {
        localStorage.setItem('washora_refresh_token', res.refreshToken);
      }
      if (res.branches && res.branches.length > 0) {
        apiClient.setActiveBranchId(res.branches[0].id);
      }
    }
    return res;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/login', payload, { skipAuth: true });
    if (res.accessToken) {
      apiClient.setAccessToken(res.accessToken);
      if (res.refreshToken && typeof window !== 'undefined') {
        localStorage.setItem('washora_refresh_token', res.refreshToken);
      }
      if (res.branches && res.branches.length > 0) {
        apiClient.setActiveBranchId(res.branches[0].id);
      }
    }
    return res;
  },

  async getMe(): Promise<AuthResponse> {
    return apiClient.get<AuthResponse>('/auth/me');
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      apiClient.clearAuth();
    }
  },
};
