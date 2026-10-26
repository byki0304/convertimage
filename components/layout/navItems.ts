import type { ComponentType } from 'react';
import { HistoryIcon, HomeIcon, UserIcon } from '@/components/ui/NeonIcons';
import type { TranslationKey } from '@/lib/i18n';

export interface NavItem {
  href: string;
  labelKey: TranslationKey;
  Icon: ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', labelKey: 'nav_home', Icon: HomeIcon },
  { href: '/history', labelKey: 'nav_history', Icon: HistoryIcon },
  { href: '/mypage', labelKey: 'nav_mypage', Icon: UserIcon },
];
