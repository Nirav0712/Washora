'use client';

import React from 'react';
import { CustomerAuthProvider } from '@/context/CustomerAuthContext';
import { CustomerShell } from '@/components/customer/CustomerShell';
import { usePathname } from 'next/navigation';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/portal/login';

  return (
    <CustomerAuthProvider>
      {isLoginPage ? children : <CustomerShell>{children}</CustomerShell>}
    </CustomerAuthProvider>
  );
}
