'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useI18n } from '@/lib/i18n';
import { DesktopSidebar } from './DesktopSidebar';
import { DesktopTopBar } from './DesktopTopBar';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileHeader } from './MobileHeader';

export function PortalLoader() {
  return (
    <div className="grid h-dvh place-items-center">
      <span className="h-14 w-14 animate-portal-spin rounded-full border-2 border-dashed border-neon-cyan shadow-neon-cyan [animation-duration:1.4s]" />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isReady, isAuthenticated, logout } = useFirebaseAuth();
  const { cycleLocale } = useI18n();

  useEffect(() => {
    if (isReady && !isAuthenticated) router.replace('/login');
  }, [isReady, isAuthenticated, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        cycleLocale();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cycleLocale]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (!isReady || !isAuthenticated) return <PortalLoader />;

  return (
    <div className="min-h-dvh">
      <DesktopSidebar />
      <MobileHeader />
      <div className="lg:pl-[280px]">
        <DesktopTopBar onLogout={handleLogout} />
        <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8 max-lg:landscape:pb-20 max-lg:landscape:pt-3">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
