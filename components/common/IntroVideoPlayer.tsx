'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronIcon, SoundIcon } from '@/components/ui/NeonIcons';
import { useI18n } from '@/lib/i18n';
import { markIntroSeen } from '@/lib/session';

export const INTRO_VIDEO_SRC = '/assets/videos/intro.mp4';
const NEXT_ROUTE = '/login';

export function IntroVideoPlayer() {
  const { t } = useI18n();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const finishedRef = useRef(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [needsTap, setNeedsTap] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    markIntroSeen();
    setIsLeaving(true);
    window.setTimeout(() => router.replace(NEXT_ROUTE), 350);
  }, [router]);

  useEffect(() => {
    router.prefetch(NEXT_ROUTE);
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => setNeedsTap(true));
  }, [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finish]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleTapToPlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.play().then(() => setNeedsTap(false)).catch(finish);
  };

  return (
    <motion.div
      className="theme-dark relative flex h-dvh w-screen items-center justify-center overflow-hidden bg-obsidian text-white"
      animate={{ opacity: isLeaving ? 0 : 1 }}
      transition={{ duration: 0.35 }}
    >
      <video
        ref={videoRef}
        src={INTRO_VIDEO_SRC}
        autoPlay
        muted={isMuted}
        playsInline
        preload="auto"
        onEnded={finish}
        onError={finish}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (v.duration) setProgress(v.currentTime / v.duration);
        }}
        className="h-full w-full object-cover"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-obsidian/70 via-transparent to-obsidian/30" />

      <div className="absolute right-4 top-4 z-50 flex items-center gap-3 sm:right-6 sm:top-6">
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={toggleMute}
          className="flex items-center gap-2 rounded-xl border border-neon-cyan/50 bg-obsidian-card/80 px-4 py-2 text-sm font-medium text-neon-cyan backdrop-blur-glass transition-all hover:bg-neon-cyan/20 hover:shadow-neon-cyan"
        >
          <SoundIcon muted={isMuted} className="h-4 w-4" />
          {isMuted ? t('intro_unmute') : t('intro_mute')}
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={finish}
          className="flex items-center gap-1 rounded-xl bg-neon-magenta/80 px-5 py-2 text-sm font-bold tracking-wider text-white shadow-neon-magenta backdrop-blur-glass transition-all hover:brightness-125"
        >
          {t('intro_skip')}
          <ChevronIcon className="h-4 w-4" />
        </motion.button>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-magenta shadow-[0_0_12px_#00F0FF]"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <AnimatePresence>
        {needsTap && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleTapToPlay}
            className="absolute inset-0 z-40 grid place-items-center bg-obsidian/80 backdrop-blur-glass"
          >
            <span className="animate-pulse-glow rounded-2xl border border-neon-cyan/60 px-8 py-4 text-lg font-bold text-neon-cyan">
              {t('intro_tap_to_play')}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
