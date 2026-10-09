'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminApiClient } from '../lib/api';
import { PlatformAdminUser } from '@washora/shared';

interface AdminAuthContextType {
  admin: PlatformAdminUser | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<PlatformAdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('washora_admin_token');
    if (storedToken) {
      setToken(storedToken);
      AdminApiClient.getMe()
        .then((profile) => setAdmin(profile))
        .catch(() => {
          localStorage.removeItem('washora_admin_token');
          setToken(null);
          setAdmin(null);
          router.push('/login');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await AdminApiClient.login(credentials);
    if (res.token) {
      localStorage.setItem('washora_admin_token', res.token);
      setToken(res.token);
      setAdmin(res.admin);
      if (res.admin?.role === 'PARTNER_ADMIN') {
        router.push('/partner-dashboard');
      } else {
        router.push('/');
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('washora_admin_token');
    setToken(null);
    setAdmin(null);
    router.push('/login');
  };

  const refreshProfile = async () => {
    if (token) {
      const profile = await AdminApiClient.getMe();
      setAdmin(profile);
    }
  };

  return (
    <AdminAuthContext.Provider value={{ admin, token, isLoading, login, logout, refreshProfile }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return ctx;
};
