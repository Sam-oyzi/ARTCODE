
'use client';

import { AuthProvider } from '@/context/auth-context';
import { ModelProvider } from '@/context/model-context';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ModelProvider>{children}</ModelProvider>
    </AuthProvider>
  );
}
