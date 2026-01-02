'use client';

import { SessionProvider } from 'next-auth/react';
import { DialogProvider } from '@/contexts/DialogProvider';
import SessionTimeout from './SessionTimeout';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DialogProvider>
        {children}
        <SessionTimeout />
      </DialogProvider>
    </SessionProvider>
  );
}
