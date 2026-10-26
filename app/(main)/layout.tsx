'use client';

import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ConverterProvider } from '@/hooks/useImageConverter';

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <ConverterProvider>
      <AppShell>{children}</AppShell>
    </ConverterProvider>
  );
}
