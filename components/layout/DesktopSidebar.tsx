'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { FormatSelect } from '@/components/converter/FormatSelect';
import { Logo } from '@/components/ui/Logo';
import { FilmIcon, KeyboardIcon, SoundIcon } from '@/components/ui/NeonIcons';
import { useConversionHistory } from '@/hooks/useConversionHistory';
import { useI18n } from '@/lib/i18n';
import { useSettings } from '@/lib/settings';
import { NAV_ITEMS } from './navItems';

export function DesktopSidebar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const { entries } = useConversionHistory();
  const { preferredFormat, setPreferredFormat, soundEnabled, setSoundEnabled } = useSettings();

  const shortcuts = [
    { keys: 'Ctrl + U', label: t('shortcut_upload') },
    { keys: 'Enter', label: t('shortcut_convert') },
    { keys: 'Ctrl + D', label: t('shortcut_download') },
    { keys: 'Alt + L', label: t('shortcut_language') },
  ];

  return (
    <aside className="glass-panel fixed inset-y-0 left-0 z-30 hidden w-[280px] flex-col gap-6 overflow-y-auto rounded-none border-y-0 border-l-0 px-5 py-5 lg:flex">
      <div className="flex h-8 items-center">
        <Logo size="md" />
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, labelKey, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                active
                  ? 'bg-neon-cyan/10 text-neon-cyan shadow-[inset_3px_0_0_#00F0FF,0_0_14px_rgba(0,240,255,0.2)]'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>

      <section>
        <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-neon-purple">{t('sidebar_recent')}</h2>
        {entries.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-center text-xs text-white/40">
            {t('sidebar_recent_empty')}
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {entries.slice(0, 5).map((entry) => (
              <li key={entry.id} className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-2 text-xs">
                {entry.isAnimatedGif && <FilmIcon className="h-3.5 w-3.5 shrink-0 text-neon-magenta" />}
                <span className="min-w-0 flex-1 truncate text-white/80" title={entry.convertedName}>
                  {entry.convertedName}
                </span>
                <span className="shrink-0 rounded bg-neon-cyan/10 px-1.5 py-0.5 font-mono text-[10px] uppercase text-neon-cyan">
                  {entry.fromFormat}→{entry.toFormat}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-neon-purple">{t('sidebar_quick_config')}</h2>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-white/60">{t('sidebar_language')}</span>
          <LanguageSwitcher compact />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-white/60">{t('mypage_pref_format')}</span>
          <FormatSelect value={preferredFormat} onChange={setPreferredFormat} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-white/60">{t('sidebar_sound')}</span>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
              soundEnabled ? 'border-neon-cyan/50 text-neon-cyan' : 'border-white/15 text-white/40'
            }`}
          >
            <SoundIcon muted={!soundEnabled} className="h-3.5 w-3.5" />
            {soundEnabled ? t('sidebar_sound_on') : t('sidebar_sound_off')}
          </button>
        </div>
      </section>

      <section className="mt-auto">
        <h2 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-neon-purple">
          <KeyboardIcon className="h-3.5 w-3.5" glow={false} />
          {t('sidebar_shortcuts')}
        </h2>
        <ul className="flex flex-col gap-1 text-[11px] text-white/50">
          {shortcuts.map((s) => (
            <li key={s.keys} className="flex justify-between gap-2">
              <span>{s.label}</span>
              <kbd className="rounded border border-white/15 bg-white/5 px-1.5 font-mono text-white/70">{s.keys}</kbd>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
