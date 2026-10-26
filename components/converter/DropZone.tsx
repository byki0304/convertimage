'use client';

import { motion } from 'framer-motion';
import { useRef, useState, type RefObject } from 'react';
import { ImageIcon, UploadIcon } from '@/components/ui/NeonIcons';
import { ACCEPT_ATTRIBUTE } from '@/lib/canvasEngine';
import { useI18n } from '@/lib/i18n';

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  hasFiles: boolean;
}

export function DropZone({ onFilesAdded, inputRef, hasFiles }: DropZoneProps) {
  const { t } = useI18n();
  const [isDragOver, setIsDragOver] = useState(false);
  const dragDepth = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current++;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) onFilesAdded(Array.from(e.dataTransfer.files));
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={t('dropzone_title')}
      onClick={openPicker}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          openPicker();
        }
      }}
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      animate={{
        scale: isDragOver ? 1.02 : 1,
        borderColor: isDragOver ? '#00F0FF' : 'rgba(0, 240, 255, 0.4)',
      }}
      transition={{ duration: 0.2 }}
      className={`relative flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-obsidian-glass text-center outline-none backdrop-blur-glass transition-shadow focus-visible:shadow-neon-cyan ${
        hasFiles ? 'gap-2 p-5 max-lg:landscape:p-3' : 'gap-3 p-8 sm:p-12 max-lg:landscape:p-4'
      } ${isDragOver ? 'animate-pulse-glow' : 'shadow-neon-purple hover:border-neon-magenta'}`}
    >
      <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-neon-cyan/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-neon-magenta/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 animate-portal-spin rounded-full border border-dashed border-neon-purple/20" />

      <div className={`relative grid place-items-center rounded-2xl border border-neon-cyan/40 bg-obsidian-card/80 text-neon-cyan ${hasFiles ? 'h-11 w-11' : 'h-16 w-16 max-lg:landscape:h-11 max-lg:landscape:w-11'}`}>
        {isDragOver ? <UploadIcon className="h-1/2 w-1/2" /> : <ImageIcon className="h-1/2 w-1/2" />}
      </div>

      <h3 className="relative text-base font-bold tracking-wide text-white sm:text-lg">
        {isDragOver ? t('dropzone_active') : t('dropzone_title')}
      </h3>
      <p className="relative text-xs text-white/50 sm:text-sm">{t('dropzone_sub')}</p>

      <span className="relative mt-1 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-magenta px-5 py-2.5 text-sm font-semibold text-white shadow-neon-magenta transition-all hover:brightness-125">
        <UploadIcon className="h-4 w-4" />
        {t('btn_select_file')}
      </span>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTRIBUTE}
        className="hidden"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          if (e.target.files) onFilesAdded(Array.from(e.target.files));
          e.target.value = '';
        }}
      />
    </motion.div>
  );
}
