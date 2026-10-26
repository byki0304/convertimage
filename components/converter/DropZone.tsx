'use client';

import { motion } from 'framer-motion';
import { useRef, useState, type ReactNode, type RefObject } from 'react';
import { ImageIcon, UploadIcon } from '@/components/ui/NeonIcons';
import { ACCEPT_ATTRIBUTE } from '@/lib/canvasEngine';
import { useI18n } from '@/lib/i18n';

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  /** Uploaded file list rendered inside the box; the box grows with it. */
  children?: ReactNode;
}

/**
 * Compact drop target. Empty, it is sized for roughly two file rows; uploaded files are listed
 * inside it so the box grows with the batch instead of pushing a separate list off-screen.
 */
export function DropZone({ onFilesAdded, inputRef, children }: DropZoneProps) {
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
      onClick={openPicker}
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      animate={{
        scale: isDragOver ? 1.01 : 1,
        borderColor: isDragOver ? '#00F0FF' : 'rgba(0, 240, 255, 0.4)',
      }}
      transition={{ duration: 0.2 }}
      className={`relative flex w-full cursor-pointer flex-col gap-2.5 overflow-hidden rounded-2xl border-2 border-dashed bg-obsidian-glass p-3 backdrop-blur-glass sm:p-4 max-lg:landscape:gap-2 max-lg:landscape:p-2.5 ${
        isDragOver ? 'animate-pulse-glow' : 'shadow-neon-purple hover:border-neon-magenta'
      }`}
    >
      <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-neon-cyan/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-neon-magenta/10 blur-3xl" />

      <div className="relative flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-neon-cyan/40 bg-obsidian-card/80 text-neon-cyan max-lg:landscape:h-8 max-lg:landscape:w-8">
          {isDragOver ? <UploadIcon className="h-1/2 w-1/2" /> : <ImageIcon className="h-1/2 w-1/2" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold leading-snug text-white sm:text-base max-lg:landscape:text-sm">
            {isDragOver ? t('dropzone_active') : t('dropzone_title')}
          </h3>
          <p className="truncate text-[11px] text-white/50 sm:text-xs max-lg:hidden">{t('dropzone_sub')}</p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openPicker();
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-magenta px-3.5 py-2 text-xs font-semibold text-on-neon shadow-neon-magenta transition-all hover:brightness-125 sm:text-sm max-lg:landscape:py-1.5"
        >
          <UploadIcon className="h-4 w-4" />
          {t('btn_select_file')}
        </button>
      </div>

      {children ? (
        <div className="relative cursor-default" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      ) : (
        <div className="relative grid min-h-14 place-items-center rounded-xl border border-dashed border-white/10 px-3 py-2 text-center text-xs text-white/40 max-lg:landscape:min-h-10">
          {t('empty_title')}
        </div>
      )}

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
