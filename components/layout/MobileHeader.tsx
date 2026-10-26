'use client';

import { usePathname } from 'next/navigation';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { FormatSelect } from '@/components/converter/FormatSelect';
import { Logo } from '@/components/ui/Logo';
import { BoltIcon } from '@/components/ui/NeonIcons';
import { useImageConverter } from '@/hooks/useImageConverter';
import { useI18n } from '@/lib/i18n';

/** Portrait: 56px header. Landscape: compact 48px single row with format quick-select and convert action. */
export function MobileHeader() {
  const { t } = useI18n();
  const pathname = usePathname();
  const { targetFormat, setTargetFormat, convertAll, isProcessing, items } = useImageConverter();
  const isHome = pathname === '/';

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-neon-cyan/15 bg-obsidian/70 px-4 backdrop-blur-glass lg:hidden max-lg:landscape:h-12">
      <Logo size="sm" />
      <div className="flex items-center gap-2">
        {isHome && (
          <div className="hidden items-center gap-2 max-lg:landscape:flex">
            <FormatSelect value={targetFormat} onChange={setTargetFormat} ariaLabel={t('label_target')} />
            <button
              type="button"
              onClick={convertAll}
              disabled={isProcessing || items.length === 0}
              className="flex h-8 items-center gap-1 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-purple px-3 text-xs font-bold text-on-neon shadow-[0_0_12px_rgba(0,240,255,0.5)] disabled:opacity-40"
            >
              <BoltIcon className="h-3.5 w-3.5" />
              {t('btn_convert_all')}
            </button>
          </div>
        )}
        <LanguageSwitcher compact />
        <ThemeToggle compact />
      </div>
    </header>
  );
}
