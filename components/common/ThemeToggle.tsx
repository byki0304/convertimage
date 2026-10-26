'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { MoonIcon, SunIcon } from '@/components/ui/NeonIcons';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';

/** Icon-only toggle: shows the moon in light mode (switch to dark) and the sun in dark mode. */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const isLight = theme === 'light';
  const label = isLight ? t('theme_to_dark') : t('theme_to_light');

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileTap={{ scale: 0.9 }}
      aria-label={label}
      title={label}
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-xl border transition-all ${
        compact ? 'h-8 w-8' : 'h-9 w-9'
      } ${
        isLight
          ? 'border-neon-purple/40 text-neon-purple hover:bg-neon-purple/10 hover:shadow-neon-purple'
          : 'border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10 hover:shadow-neon-cyan'
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.2 }}
          className="grid place-items-center"
        >
          {isLight ? <MoonIcon className="h-[18px] w-[18px]" /> : <SunIcon className="h-[18px] w-[18px]" />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
