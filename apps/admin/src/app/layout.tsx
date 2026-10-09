import type { Metadata } from 'next';
import './globals.css';
import { AdminAuthProvider } from '../context/AdminAuthContext';
import { AdminShell } from '../components/AdminShell';

export const metadata: Metadata = {
  title: 'Washora Platform Admin — SaaS Governance & Multi-Tenant Control',
  description: 'Executive administration, multi-tenant governance, subscription billing, and platform capacity management for Washora SaaS.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AdminAuthProvider>
          <AdminShell>{children}</AdminShell>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
