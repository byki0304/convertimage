'use client';

import type { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import { HistoryProvider } from '@/hooks/useConversionHistory';
import { AuthProvider } from '@/hooks/useFirebaseAuth';
import { I18nProvider } from '@/lib/i18n';
import { SettingsProvider } from '@/lib/settings';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <SettingsProvider>
        <ToastProvider>
          <AuthProvider>
            <HistoryProvider>{children}</HistoryProvider>
          </AuthProvider>
        </ToastProvider>
      </SettingsProvider>
    </I18nProvider>
  );
}
