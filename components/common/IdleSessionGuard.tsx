'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NeonButton } from '@/components/ui/NeonButton';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/lib/i18n';

const IDLE_MS = 60 * 60 * 1000;
const GRACE_MS = 2 * 60 * 1000;
const CHECK_INTERVAL_MS = 1000;
const STORAGE_THROTTLE_MS = 5000;
const ACTIVITY_KEY = 'ci_last_activity';
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;

function readSharedActivity(): number {
  const value = Number(window.localStorage.getItem(ACTIVITY_KEY));
  return Number.isFinite(value) ? value : 0;
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * After 1 hour without interaction, asks the user to extend the session and logs out
 * if the prompt is not clicked within 2 minutes. Activity is shared across tabs through
 * localStorage, and elapsed time is computed from timestamps so sleep/background
 * throttling cannot extend the session.
 */
export function IdleSessionGuard({ onLogout }: { onLogout: () => void }) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const lastActivityRef = useRef(Date.now());
  const lastPersistRef = useRef(0);
  const promptOpenRef = useRef(false);
  const loggedOutRef = useRef(false);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const logoutRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    logoutRef.current = () => {
      showToast(t('idle_logged_out'), 'info');
      onLogout();
    };
  }, [onLogout, showToast, t]);

  const recordActivity = useCallback((force = false) => {
    const now = Date.now();
    lastActivityRef.current = now;
    if (force || now - lastPersistRef.current >= STORAGE_THROTTLE_MS) {
      lastPersistRef.current = now;
      window.localStorage.setItem(ACTIVITY_KEY, String(now));
    }
  }, []);

  useEffect(() => {
    recordActivity(true);

    const onActivity = () => {
      if (!promptOpenRef.current) recordActivity();
    };
    for (const name of ACTIVITY_EVENTS) window.addEventListener(name, onActivity, { passive: true, capture: true });

    const check = () => {
      if (loggedOutRef.current) return;
      const last = Math.max(lastActivityRef.current, readSharedActivity());
      const idle = Date.now() - last;

      if (idle >= IDLE_MS + GRACE_MS) {
        loggedOutRef.current = true;
        promptOpenRef.current = false;
        setRemainingMs(null);
        logoutRef.current();
      } else if (idle >= IDLE_MS) {
        promptOpenRef.current = true;
        setRemainingMs(IDLE_MS + GRACE_MS - idle);
      } else if (promptOpenRef.current) {
        promptOpenRef.current = false;
        setRemainingMs(null);
      }
    };
    const timer = window.setInterval(check, CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
      for (const name of ACTIVITY_EVENTS) window.removeEventListener(name, onActivity, { capture: true });
    };
  }, [recordActivity]);

  const extendSession = () => {
    recordActivity(true);
    promptOpenRef.current = false;
    setRemainingMs(null);
  };

  return (
    <AnimatePresence>
      {remainingMs !== null && (
        <motion.div
          key="idle-prompt"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] grid place-items-center bg-obsidian/70 px-4 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="idle-title"
          aria-describedby="idle-desc"
        >
          <motion.div
            initial={{ scale: 0.92, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 12 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            onClick={extendSession}
            className="glass-panel w-full max-w-sm cursor-pointer rounded-2xl p-6 text-center shadow-neon-purple"
          >
            <p className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full border border-neon-magenta/50 font-mono text-lg font-bold text-neon-magenta shadow-neon-magenta">
              {formatRemaining(remainingMs)}
            </p>
            <h2 id="idle-title" className="neon-text text-xl font-extrabold">
              {t('idle_title')}
            </h2>
            <p id="idle-desc" className="mt-2 text-sm text-white/60">
              {t('idle_desc', { time: formatRemaining(remainingMs) })}
            </p>
            <NeonButton size="lg" className="mt-5 w-full" autoFocus>
              {t('idle_continue')}
            </NeonButton>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
