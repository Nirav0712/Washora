'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  Tenant,
  Membership,
  Role,
  Branch,
  AuthResponse,
  PermissionCode,
} from '@washora/shared';
import { authApi, RegisterPayload, LoginPayload } from '@/lib/api/auth';
import { apiClient } from '@/lib/api/client';

export interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  membership: Membership | null;
  role: Role | null;
  branches: Branch[];
  activeBranch: Branch | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  switchBranch: (branchId: string) => void;
  hasPermission: (permission: string) => boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const applyAuthData = (data: AuthResponse | any) => {
    if (data.user) setUser(data.user);
    if (data.tenant) setTenant(data.tenant);
    if (data.membership) setMembership(data.membership);
    if (data.role) setRole(data.role);
    if (data.permissions) setPermissions(data.permissions);
    if (data.branches && Array.isArray(data.branches)) {
      setBranches(data.branches);
      const savedBranchId = apiClient.getActiveBranchId();
      const matched = data.branches.find((b: Branch) => b.id === savedBranchId);
      const chosen = matched || data.branches[0] || null;
      setActiveBranch(chosen);
      if (chosen) {
        apiClient.setActiveBranchId(chosen.id);
      }
    }
  };

  const refreshSession = async () => {
    const token = apiClient.getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await authApi.getMe();
      applyAuthData(data);
    } catch {
      apiClient.clearAuth();
      setUser(null);
      setTenant(null);
      setMembership(null);
      setRole(null);
      setBranches([]);
      setActiveBranch(null);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = async (payload: LoginPayload): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const data = await authApi.login(payload);
      applyAuthData(data);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const data = await authApi.register(payload);
      applyAuthData(data);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setTenant(null);
      setMembership(null);
      setRole(null);
      setBranches([]);
      setActiveBranch(null);
      setPermissions([]);
      setIsLoading(false);
    }
  };

  const switchBranch = (branchId: string) => {
    const found = branches.find((b) => b.id === branchId);
    if (found) {
      setActiveBranch(found);
      apiClient.setActiveBranchId(found.id);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (role?.code === 'SHOP_OWNER' || role?.code === 'SUPER_ADMIN') return true;
    return permissions.includes(permission) || permissions.includes('*');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        membership,
        role,
        branches,
        activeBranch,
        permissions,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        switchBranch,
        hasPermission,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
