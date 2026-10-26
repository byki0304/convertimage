'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { BatchList } from '@/components/converter/BatchList';
import { DropZone } from '@/components/converter/DropZone';
import { FormatTabs } from '@/components/converter/FormatTabs';
import { NeonButton } from '@/components/ui/NeonButton';
import { AlertIcon, BoltIcon, DownloadIcon } from '@/components/ui/NeonIcons';
import { useImageConverter } from '@/hooks/useImageConverter';
import { useI18n } from '@/lib/i18n';

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target.tagName);
}

export default function ConverterPage() {
  const { t } = useI18n();
  const {
    items,
    targetFormat,
    setTargetFormat,
    isProcessing,
    progress,
    addFiles,
    removeItems,
    convertAll,
    downloadItem,
    downloadAllAsZip,
  } = useImageConverter();
  const inputRef = useRef<HTMLInputElement>(null);

  const completedCount = items.filter((item) => item.status === 'completed').length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === 'u') {
        e.preventDefault();
        inputRef.current?.click();
      } else if (mod && key === 'd') {
        e.preventDefault();
        void downloadAllAsZip();
      } else if ((e.key === 'Enter' || e.key === ' ') && !mod && !e.altKey && !isTypingTarget(e.target)) {
        e.preventDefault();
        void convertAll();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [convertAll, downloadAllAsZip]);

  const formatNotice =
    targetFormat === 'jpg' ? t('msg_lossy_jpg') : targetFormat === 'gif' ? t('msg_gif_palette') : null;

  return (
    <div className="flex flex-col gap-5 max-lg:landscape:gap-3">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-lg:landscape:hidden">
        <h1 className="neon-text text-2xl font-extrabold sm:text-3xl">{t(`tab_${targetFormat}`)}</h1>
        <p className="mt-1.5 text-sm text-white/55">{t('first_screen_guide')}</p>
      </motion.div>

      <FormatTabs value={targetFormat} onChange={setTargetFormat} disabled={isProcessing} />

      {formatNotice && (
        <p className="flex items-center gap-2 rounded-xl border border-neon-purple/30 bg-neon-purple/10 px-3 py-2 text-xs text-white/70">
          <AlertIcon className="h-4 w-4 shrink-0 text-neon-purple" />
          {formatNotice}
        </p>
      )}

      <DropZone onFilesAdded={addFiles} inputRef={inputRef} hasFiles={items.length > 0} />

      {items.length > 0 ? (
        <>
          <div className="glass-panel sticky top-14 z-10 flex flex-wrap items-center gap-2 rounded-2xl p-3 lg:top-16 max-lg:landscape:top-12">
            <NeonButton
              onClick={() => void convertAll()}
              disabled={isProcessing}
              icon={<BoltIcon />}
              className="flex-1 sm:flex-none"
            >
              {isProcessing ? t('msg_converting', progress) : `${t('btn_convert_all')} · ${targetFormat.toUpperCase()}`}
            </NeonButton>
            <NeonButton
              variant="ghost"
              onClick={() => void downloadAllAsZip()}
              disabled={isProcessing || completedCount === 0}
              icon={<DownloadIcon />}
              className="flex-1 sm:flex-none"
            >
              {t('btn_download_all')}
            </NeonButton>
            {isProcessing && (
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-magenta shadow-[0_0_10px_#00F0FF]"
                  animate={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            )}
          </div>

          <BatchList items={items} onRemoveItems={removeItems} onDownload={downloadItem} disabled={isProcessing} />
        </>
      ) : (
        <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/40">
          {t('empty_title')}
        </p>
      )}
    </div>
  );
}
