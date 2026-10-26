'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { NAV_ITEMS } from './navItems';

/** Portrait: 64px tall with stacked labels. Landscape: slim 56px with inline labels. */
export function MobileBottomNav() {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-neon-cyan/20 bg-obsidian/85 backdrop-blur-glass lg:hidden">
      <ul className="mx-auto flex h-16 max-w-xl items-stretch max-lg:landscape:h-14">
        {NAV_ITEMS.map(({ href, labelKey, Icon }) => {
          const active = pathname === href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`relative flex h-full flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors max-lg:landscape:flex-row max-lg:landscape:gap-2 max-lg:landscape:text-xs ${
                  active ? 'text-neon-cyan' : 'text-white/50'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-indicator"
                    className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-neon-cyan shadow-[0_0_10px_#00F0FF]"
                  />
                )}
                <Icon className="h-5 w-5" />
                {t(labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
