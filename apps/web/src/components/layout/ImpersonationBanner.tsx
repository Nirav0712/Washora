'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, LogOut, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api/client';

export const ImpersonationBanner: React.FC = () => {
  const { tenant } = useAuth();
  const [isImpersonated, setIsImpersonated] = useState(false);
  const [impersonatorName, setImpersonatorName] = useState('Super Admin');
  const defaultAdminUrl = (process.env.NEXT_PUBLIC_ADMIN_URL
    || (process.env.NODE_ENV === 'production' ? 'https://washora-myo9.vercel.app' : 'http://localhost:3002')).replace(/\/+$/, '');
  const [returnUrl, setReturnUrl] = useState(`${defaultAdminUrl}/tenants`);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const imp = localStorage.getItem('washora_impersonated') === 'true';
      const name = localStorage.getItem('washora_impersonator_name') || 'Super Admin';
      const ret = localStorage.getItem('washora_impersonator_return_url') || `${defaultAdminUrl}/tenants`;
      setIsImpersonated(imp);
      setImpersonatorName(name);
      setReturnUrl(ret);
    }
  }, [defaultAdminUrl]);

  if (!isImpersonated) return null;

  const handleExit = () => {
    if (typeof window !== 'undefined') {
      apiClient.clearAuth();
      localStorage.removeItem('washora_impersonated');
      localStorage.removeItem('washora_impersonator_name');
      localStorage.removeItem('washora_impersonator_return_url');
      window.location.href = returnUrl;
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs sm:text-sm font-medium z-50 sticky top-0">
      <div className="flex items-center gap-2.5 max-w-4xl truncate">
        <div className="p-1 rounded-lg bg-white/20 text-white flex-shrink-0">
          <ShieldAlert className="w-4 h-4 animate-pulse" />
        </div>
        <div className="truncate">
          <span className="font-bold tracking-wide uppercase text-[11px] bg-black/20 px-2 py-0.5 rounded-full mr-2">
            Support Access Mode
          </span>
          <span>
            You are logged in as Shop Owner for <strong className="underline decoration-white/50">{tenant?.name || 'this Laundry Store'}</strong> (Session initiated by {impersonatorName}).
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
        <button
          onClick={handleExit}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white text-slate-900 hover:bg-amber-50 font-bold text-xs shadow-sm transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Shop Session</span>
        </button>
      </div>
    </div>
  );
};
