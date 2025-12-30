import type { Metadata } from 'next';
import './globals.css';
import { DialogProvider } from '@/contexts/DialogProvider';
import { SessionProvider } from 'next-auth/react';
import SessionTimeout from '@/components/SessionTimeout';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'School Asset Management',
  description: 'Premium IT Asset Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen bg-slate-50 font-sans text-slate-900" suppressHydrationWarning>
        <SessionProvider>
          <DialogProvider>
            {children}
          </DialogProvider>
          <SessionTimeout />
        </SessionProvider>
        <Analytics />
        <div id="portal-root"></div>
      </body>
    </html>
  );
}
