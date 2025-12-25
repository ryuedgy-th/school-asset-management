import type { Metadata } from 'next';
import './globals.css';
import { DialogProvider } from '@/contexts/DialogProvider';

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
        <DialogProvider>
          {children}
        </DialogProvider>
        <div id="portal-root"></div>
      </body>
    </html>
  );
}
