'use client';

import { useEffect, useState } from 'react';

export type LayoutProfile = 'desktop' | 'mobile-portrait' | 'mobile-landscape';

const DESKTOP_QUERY = '(min-width: 1024px)';
const LANDSCAPE_QUERY = '(orientation: landscape)';

function resolveProfile(): LayoutProfile {
  if (window.matchMedia(DESKTOP_QUERY).matches) return 'desktop';
  return window.matchMedia(LANDSCAPE_QUERY).matches ? 'mobile-landscape' : 'mobile-portrait';
}

/**
 * Layout itself switches through pure CSS media queries (no JS delay); this hook only
 * exposes the active profile for behaviour such as swipe gestures.
 */
export function useResponsiveLayout(): LayoutProfile {
  const [profile, setProfile] = useState<LayoutProfile>('desktop');

  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const landscape = window.matchMedia(LANDSCAPE_QUERY);
    const update = () => setProfile(resolveProfile());
    update();
    desktop.addEventListener('change', update);
    landscape.addEventListener('change', update);
    return () => {
      desktop.removeEventListener('change', update);
      landscape.removeEventListener('change', update);
    };
  }, []);

  return profile;
}
