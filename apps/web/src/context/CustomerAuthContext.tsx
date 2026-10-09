'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  customerAuthApi,
  CustomerAuthResponse,
  getCustomerToken,
  getCustomerSession,
  clearCustomerAuth,
} from '@/lib/api/customer-auth';

export interface CustomerAuthContextType {
  account: CustomerAuthResponse['account'] | null;
  customer: CustomerAuthResponse['customer'] | null;
  tenant: CustomerAuthResponse['tenant'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requestOtp: (phone: string, tenantSlug?: string) => Promise<{ success: boolean; message: string; testOtp?: string; expiresAt?: string }>;
  verifyOtp: (phone: string, otp: string, tenantSlug?: string) => Promise<CustomerAuthResponse>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<CustomerAuthResponse['account'] | null>(null);
  const [customer, setCustomer] = useState<CustomerAuthResponse['customer'] | null>(null);
  const [tenant, setTenant] = useState<CustomerAuthResponse['tenant'] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const applySession = (session: CustomerAuthResponse | null) => {
    if (session) {
      setAccount(session.account || null);
      setCustomer(session.customer || null);
      setTenant(session.tenant || null);
    } else {
      setAccount(null);
      setCustomer(null);
      setTenant(null);
    }
  };

  const refreshSession = async () => {
    const token = getCustomerToken();
    if (!token) {
      applySession(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await customerAuthApi.getMe();
      applySession(data);
    } catch {
      clearCustomerAuth();
      applySession(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const cached = getCustomerSession();
    if (cached) {
      applySession(cached);
      setIsLoading(false);
    }
    refreshSession();
  }, []);

  const requestOtp = async (phone: string, tenantSlug?: string) => {
    return customerAuthApi.requestOtp(phone, tenantSlug);
  };

  const verifyOtp = async (phone: string, otp: string, tenantSlug?: string) => {
    setIsLoading(true);
    try {
      const res = await customerAuthApi.verifyOtp(phone, otp, tenantSlug);
      applySession(res);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await customerAuthApi.logout();
    } finally {
      applySession(null);
      setIsLoading(false);
    }
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        account,
        customer,
        tenant,
        isAuthenticated: !!account && !!getCustomerToken(),
        isLoading,
        requestOtp,
        verifyOtp,
        logout,
        refreshSession,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = (): CustomerAuthContextType => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};
