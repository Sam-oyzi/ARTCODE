'use client';

import { usePathname } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { ReactNode } from 'react';

interface ConditionalAppShellProps {
  children: ReactNode;
}

export function ConditionalAppShell({ children }: ConditionalAppShellProps) {
  const pathname = usePathname();
  const isBlockedPage = pathname === '/blocked';

  if (isBlockedPage) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
} 