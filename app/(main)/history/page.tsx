'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { NeonCheckbox } from '@/components/ui/NeonCheckbox';
import { FilmIcon, HistoryIcon } from '@/components/ui/NeonIcons';
import { SelectionActionButton } from '@/components/ui/SelectionActionButton';
import { useToast } from '@/components/ui/Toast';
import { useConversionHistory } from '@/hooks/useConversionHistory';
import { useSelection } from '@/hooks/useSelection';
import { formatBytes } from '@/lib/canvasEngine';
import { useI18n } from '@/lib/i18n';

export default function HistoryPage() {
  const { t, locale } = useI18n();
  const { showToast } = useToast();
  const { entries, isMemberHistory, deleteEntries } = useConversionHistory();
  const entryIds = useMemo(() => entries.map((entry) => entry.id), [entries]);
  const selection = useSelection(entryIds);
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' });

  const deleteSelected = async () => {
    const ids = selection.selectedIds;
    try {
      await deleteEntries(ids);
      selection.clear();
      showToast(t('msg_deleted', { count: ids.length }), 'success');
    } catch (error) {
      console.error('Failed to delete history', error);
      showToast(t('msg_error_generic'), 'error');
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="neon-text flex items-center gap-2 text-2xl font-extrabold">
          <HistoryIcon className="h-6 w-6 text-neon-cyan" />
          {t('history_title')}
        </h1>
        <p className="mt-1 text-xs text-white/45">{isMemberHistory ? t('history_member_note') : t('history_guest_note')}</p>
        <p className="mt-0.5 text-xs text-white/45">{t('history_retention_note')}</p>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-white/40">
          {t('history_empty')}
        </p>
      ) : (
        <>
          <SelectionActionButton
            selectedCount={selection.selectedCount}
            onSelectAll={selection.selectAll}
            onDeleteSelected={() => void deleteSelected()}
            onClearSelection={selection.clear}
          />
          <ul className="grid gap-2 max-lg:landscape:grid-cols-2">
            {entries.map((entry, i) => {
              const checked = selection.isSelected(entry.id);
              return (
                <motion.li
                  key={entry.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i, 10) * 0.02 }}
                  className={`glass-panel flex items-center gap-3 rounded-xl px-4 py-3 ${
                    checked ? 'border-neon-cyan bg-neon-cyan/[0.06] shadow-[0_0_12px_rgba(0,240,255,0.25)]' : ''
                  }`}
                >
                  <NeonCheckbox
                    checked={checked}
                    onChange={() => selection.toggle(entry.id)}
                    label={`${t('label_select_item')}: ${entry.convertedName}`}
                  />
                  <span className="shrink-0 rounded-md bg-neon-cyan/10 px-2 py-1 font-mono text-[11px] font-bold uppercase text-neon-cyan">
                    {entry.fromFormat} → {entry.toFormat}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white" title={entry.convertedName}>
                      {entry.convertedName}
                    </p>
                    <p className="truncate text-[11px] text-white/40">
                      {entry.originalName} · {formatBytes(entry.fileSize)} → {formatBytes(entry.convertedSize)}
                    </p>
                  </div>
                  {entry.isAnimatedGif && <FilmIcon className="h-4 w-4 shrink-0 text-neon-magenta" />}
                  <time className="hidden shrink-0 text-[11px] text-white/40 sm:block">
                    {dateFormatter.format(new Date(entry.convertedAt))}
                  </time>
                </motion.li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
