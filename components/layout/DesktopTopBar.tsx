'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LogoutIcon, UserIcon } from '@/components/ui/NeonIcons';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useI18n } from '@/lib/i18n';

export function DesktopTopBar({ onLogout }: { onLogout: () => void }) {
  const { t } = useI18n();
  const { displayName } = useFirebaseAuth();
  const name = displayName || t('mypage_guest');

  return (
    <header className="sticky top-0 z-20 hidden h-16 items-center justify-between border-b border-neon-cyan/10 bg-obsidian/60 px-8 backdrop-blur-glass lg:flex">
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/40">{t('app_subtitle')}</p>
      <div className="flex items-center gap-2">
        <span className="mr-2 max-w-[200px] truncate text-xs text-white/50">{name}</span>
        <Link
          href="/mypage"
          className="flex items-center gap-1.5 rounded-xl border border-neon-cyan/40 px-3 py-2 text-xs font-semibold text-neon-cyan transition-all hover:bg-neon-cyan/10 hover:shadow-neon-cyan"
        >
          <UserIcon className="h-4 w-4" />
          {t('nav_mypage')}
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1.5 rounded-xl border border-neon-magenta/40 px-3 py-2 text-xs font-semibold text-neon-magenta transition-all hover:bg-neon-magenta/10 hover:shadow-neon-magenta"
        >
          <LogoutIcon className="h-4 w-4" />
          {t('nav_logout')}
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
