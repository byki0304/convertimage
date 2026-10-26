'use client';

import { useRouter } from 'next/navigation';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { FormatSelect } from '@/components/converter/FormatSelect';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { NeonButton } from '@/components/ui/NeonButton';
import { GhostIcon, LogoutIcon, SoundIcon, UserIcon } from '@/components/ui/NeonIcons';
import { useToast } from '@/components/ui/Toast';
import { useConversionHistory } from '@/hooks/useConversionHistory';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useI18n } from '@/lib/i18n';
import { useSettings } from '@/lib/settings';
import type { TargetFormat } from '@/types';

export default function MyPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { showToast } = useToast();
  const { user, isGuest, logout } = useFirebaseAuth();
  const { totalConversions } = useConversionHistory();
  const { preferredFormat, setPreferredFormat, soundEnabled, setSoundEnabled } = useSettings();

  const providerId = user?.providerData[0]?.providerId ?? (user?.phoneNumber ? 'phone' : null);
  const displayName = user?.displayName || user?.email || user?.phoneNumber || t('mypage_guest');

  const handleFormatChange = (format: TargetFormat) => {
    setPreferredFormat(format);
    showToast(t('mypage_saved'), 'success');
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <div className="flex flex-col gap-5">
      <h1 className="neon-text flex items-center gap-2 text-2xl font-extrabold">
        <UserIcon className="h-6 w-6 text-neon-cyan" />
        {t('mypage_title')}
      </h1>

      <div className="grid gap-4 lg:grid-cols-2 max-lg:landscape:grid-cols-2">
        <GlassPanel className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl border border-neon-cyan/50 bg-obsidian-card text-neon-cyan shadow-neon-cyan">
              {isGuest ? <GhostIcon className="h-7 w-7" /> : <UserIcon className="h-7 w-7" />}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-white">{displayName}</p>
              <p className="text-xs text-white/45">
                {t('mypage_total')}: <span className="font-mono text-neon-cyan">{totalConversions}</span>
              </p>
            </div>
          </div>

          {user ? (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              {user.email && (
                <>
                  <dt className="text-white/45">{t('mypage_email')}</dt>
                  <dd className="truncate text-white">{user.email}</dd>
                </>
              )}
              {user.phoneNumber && (
                <>
                  <dt className="text-white/45">{t('mypage_phone')}</dt>
                  <dd className="text-white">{user.phoneNumber}</dd>
                </>
              )}
              {providerId && (
                <>
                  <dt className="text-white/45">{t('mypage_provider')}</dt>
                  <dd className="font-mono text-xs text-neon-purple">{providerId}</dd>
                </>
              )}
            </dl>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-white/55">{t('mypage_guest_desc')}</p>
              <NeonButton onClick={handleLogout}>{t('mypage_login_cta')}</NeonButton>
            </div>
          )}

          {user && (
            <NeonButton variant="danger" icon={<LogoutIcon />} onClick={handleLogout} className="mt-auto">
              {t('nav_logout')}
            </NeonButton>
          )}
        </GlassPanel>

        <GlassPanel className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-white/70">{t('mypage_pref_language')}</span>
            <LanguageSwitcher />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-white/70">{t('mypage_pref_format')}</span>
            <FormatSelect value={preferredFormat} onChange={handleFormatChange} ariaLabel={t('mypage_pref_format')} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-white/70">{t('sidebar_sound')}</span>
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                soundEnabled ? 'border-neon-cyan/50 text-neon-cyan shadow-neon-cyan' : 'border-white/15 text-white/40'
              }`}
            >
              <SoundIcon muted={!soundEnabled} className="h-4 w-4" />
              {soundEnabled ? t('sidebar_sound_on') : t('sidebar_sound_off')}
            </button>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
