'use client';

import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { TARGET_FORMATS, type TargetFormat } from '@/types';

interface FormatTabsProps {
  value: TargetFormat;
  onChange: (format: TargetFormat) => void;
  disabled?: boolean;
}

/** PNG is always the first (default) tab. Mobile shows every tab at once: 3×2 grid in portrait, one row in landscape. */
export function FormatTabs({ value, onChange, disabled }: FormatTabsProps) {
  const { t } = useI18n();

  return (
    <div
      role="tablist"
      aria-label={t('label_target')}
      className="grid grid-cols-3 gap-1.5 max-lg:landscape:grid-cols-6 lg:flex lg:gap-1 lg:border-b lg:border-white/10"
    >
      {TARGET_FORMATS.map((format) => {
        const active = format === value;
        return (
          <button
            key={format}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(format)}
            className={`relative shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed max-lg:min-w-0 max-lg:whitespace-normal max-lg:rounded-xl max-lg:border max-lg:px-1.5 max-lg:py-2 max-lg:text-xs max-lg:leading-tight max-lg:landscape:py-1.5 ${
              active
                ? 'text-neon-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.8)] max-lg:border-neon-cyan/60 max-lg:bg-neon-cyan/10'
                : 'text-white/55 hover:text-white max-lg:border-white/10 max-lg:bg-obsidian-card/60'
            }`}
          >
            {t(`tab_${format}`)}
            {active && (
              <motion.span
                layoutId="format-tab-underline"
                className="absolute inset-x-2 -bottom-px hidden h-0.5 rounded-full bg-neon-cyan shadow-[0_0_12px_#00F0FF] lg:block"
                transition={{ type: 'spring', stiffness: 600, damping: 40 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
