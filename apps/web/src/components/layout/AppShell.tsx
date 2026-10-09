'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { ToastContainer } from '../ui/ToastContainer';
import { ImpersonationBanner } from './ImpersonationBanner';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();

  const isPublicOrPortal =
    pathname === '/' ||
    pathname === '/pricing' ||
    pathname === '/features' ||
    pathname === '/faq' ||
    pathname === '/contact' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/signup' ||
    pathname === '/track' ||
    pathname.startsWith('/portal');

  if (isPublicOrPortal) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] dark:bg-[#0B0F19] text-[#172033] dark:text-[#F1F5F9] transition-colors duration-200">
        <ToastContainer />
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F6F8FB] dark:bg-[#0B0F19] text-[#172033] dark:text-[#F1F5F9] transition-colors duration-200">
      {/* Toast notifications */}
      <ToastContainer />

      {/* Desktop Collapsible Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <ImpersonationBanner />
        <TopBar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
};

