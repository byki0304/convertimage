'use client';

import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { TARGET_FORMATS, type TargetFormat } from '@/types';

interface FormatTabsProps {
  value: TargetFormat;
  onChange: (format: TargetFormat) => void;
  disabled?: boolean;
}

/** PNG is always the first (default) tab. Hidden in mobile landscape, where the header quick-select takes over. */
export function FormatTabs({ value, onChange, disabled }: FormatTabsProps) {
  const { t } = useI18n();

  return (
    <div
      role="tablist"
      aria-label={t('label_target')}
      className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 max-lg:landscape:hidden lg:border-b lg:border-white/10"
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
            className={`relative shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed max-lg:rounded-xl max-lg:border ${
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
