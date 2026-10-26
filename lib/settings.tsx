'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { sfx } from './sfx';
import { TARGET_FORMATS, type TargetFormat } from '@/types';

const FORMAT_KEY = 'ci_preferred_format';
const SOUND_KEY = 'ci_sound_enabled';

interface SettingsContextValue {
  preferredFormat: TargetFormat;
  setPreferredFormat: (format: TargetFormat) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  playSfx: (name: keyof typeof sfx) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [preferredFormat, setPreferredFormatState] = useState<TargetFormat>('png');
  const [soundEnabled, setSoundEnabledState] = useState(true);

  useEffect(() => {
    const savedFormat = window.localStorage.getItem(FORMAT_KEY) as TargetFormat | null;
    if (savedFormat && TARGET_FORMATS.includes(savedFormat)) setPreferredFormatState(savedFormat);
    const savedSound = window.localStorage.getItem(SOUND_KEY);
    if (savedSound !== null) setSoundEnabledState(savedSound === '1');
  }, []);

  const setPreferredFormat = useCallback((format: TargetFormat) => {
    setPreferredFormatState(format);
    window.localStorage.setItem(FORMAT_KEY, format);
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    window.localStorage.setItem(SOUND_KEY, enabled ? '1' : '0');
  }, []);

  const playSfx = useCallback(
    (name: keyof typeof sfx) => {
      if (soundEnabled) sfx[name]();
    },
    [soundEnabled]
  );

  const value = useMemo(
    () => ({ preferredFormat, setPreferredFormat, soundEnabled, setSoundEnabled, playSfx }),
    [preferredFormat, setPreferredFormat, soundEnabled, setSoundEnabled, playSfx]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
