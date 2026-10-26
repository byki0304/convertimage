'use client';

import { motion } from 'framer-motion';
import { useId } from 'react';
import { useI18n } from '@/lib/i18n';
import { LOCALES } from '@/types';

const LABELS = { ko: 'Ko', en: 'En', ja: 'Ja' } as const;

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  const instanceId = useId();

  return (
    <div
      role="radiogroup"
      aria-label={t('sidebar_language')}
      className="relative inline-flex rounded-xl border border-neon-purple/40 bg-obsidian-card/70 p-0.5 backdrop-blur-glass"
    >
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={active}
            title={t(`lang_${code}`)}
            onClick={() => setLocale(code)}
            className={`relative z-10 rounded-lg font-bold transition-colors ${compact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'} ${
              active ? 'text-obsidian' : 'text-white/60 hover:text-neon-cyan'
            }`}
          >
            {active && (
              <motion.span
                layoutId={`lang-pill-${instanceId}`}
                className="absolute inset-0 -z-10 rounded-lg bg-neon-cyan shadow-[0_0_12px_#00F0FF]"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            {LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}
