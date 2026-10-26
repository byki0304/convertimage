'use client';

import { motion } from 'framer-motion';
import { NeonCheckbox } from '@/components/ui/NeonCheckbox';
import { AlertIcon, CheckIcon, DownloadIcon, FilmIcon } from '@/components/ui/NeonIcons';
import { formatBytes } from '@/lib/canvasEngine';
import { useI18n } from '@/lib/i18n';
import type { ConvertedFileItem } from '@/types';

interface FileCardProps {
  item: ConvertedFileItem;
  index: number;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onDownload: (id: string) => void;
  disabled?: boolean;
}

const STATUS_STYLES = {
  pending: 'border-white/15 text-white/50',
  processing: 'border-neon-purple/60 text-neon-purple animate-pulse',
  completed: 'border-neon-cyan/60 text-neon-cyan',
  error: 'border-neon-magenta/60 text-neon-magenta',
} as const;

export function FileCard({ item, index, selected, onToggleSelect, onDownload, disabled }: FileCardProps) {
  const { t } = useI18n();
  const isError = item.status === 'error';
  const isDone = item.status === 'completed';

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className={`glass-panel group relative flex gap-3 overflow-hidden rounded-xl p-3 ${
        selected
          ? 'border-neon-cyan bg-neon-cyan/[0.06] shadow-[0_0_12px_rgba(0,240,255,0.25)]'
          : isError
            ? 'border-neon-magenta/50'
            : isDone
              ? 'border-neon-cyan/50'
              : ''
      }`}
    >
      {isError && <div className="pointer-events-none absolute inset-0 animate-glitch bg-neon-magenta/[0.04]" />}

      <div className="flex items-center">
        <NeonCheckbox
          checked={selected}
          onChange={() => onToggleSelect(item.id)}
          label={`${t('label_select_item')}: ${item.originalName}`}
          disabled={disabled}
        />
      </div>

      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[conic-gradient(#1a1c28_25%,#12131c_0_50%,#1a1c28_0_75%,#12131c_0)] bg-[length:12px_12px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.convertedUrl ?? item.previewUrl}
          alt={item.originalName}
          className="h-full w-full object-contain"
          draggable={false}
        />
        <span className="absolute left-1 top-1 rounded bg-obsidian/80 px-1 font-mono text-[9px] text-white/70">{index + 1}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-white" title={item.originalName}>
            {item.originalName}
          </p>
          <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLES[item.status]}`}>
            {t(`status_${item.status}`)}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/45">
          <span className="rounded bg-white/5 px-1.5 font-mono uppercase text-white/70">{item.sourceFormat}</span>
          <span>{formatBytes(item.originalFile.size)}</span>
          {item.width && item.height && (
            <span>
              {item.width}×{item.height}
            </span>
          )}
          {item.sourceFormat === 'gif' && item.frameCount !== undefined && (
            <span className="inline-flex items-center gap-1 text-neon-purple">
              <FilmIcon className="h-3 w-3" glow={false} />
              {t('msg_gif_frames', { count: item.frameCount })}
            </span>
          )}
        </div>

        {item.isAnimatedGif && (
          <p className="mt-1.5 rounded-md border border-neon-magenta/30 bg-neon-magenta/10 px-2 py-1 text-[11px] text-neon-magenta">
            {t('msg_gif_detected')}
          </p>
        )}

        {isDone && item.convertedBlob && item.convertedName && (
          <p className="mt-1.5 flex items-center gap-1.5 truncate text-[11px] text-neon-cyan">
            <CheckIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate" title={item.convertedName}>
              {item.convertedName}
            </span>
            <span className="shrink-0 text-white/40">· {formatBytes(item.convertedBlob.size)}</span>
          </p>
        )}

        {isError && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-neon-magenta">
            <AlertIcon className="h-3.5 w-3.5 shrink-0" />
            {t('msg_error_generic')} <span className="font-mono text-white/40">{item.errorMessage}</span>
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-col justify-center">
        <button
          type="button"
          onClick={() => onDownload(item.id)}
          disabled={!isDone}
          title={t('btn_download')}
          aria-label={t('btn_download')}
          className="grid h-8 w-8 place-items-center rounded-lg border border-neon-cyan/40 text-neon-cyan transition-all hover:bg-neon-cyan/15 hover:shadow-neon-cyan disabled:pointer-events-none disabled:opacity-25"
        >
          <DownloadIcon className="h-4 w-4" />
        </button>
      </div>
    </motion.li>
  );
}
