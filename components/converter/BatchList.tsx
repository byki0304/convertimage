'use client';

import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { ChevronIcon } from '@/components/ui/NeonIcons';
import { SelectionActionButton } from '@/components/ui/SelectionActionButton';
import { useToast } from '@/components/ui/Toast';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useSelection } from '@/hooks/useSelection';
import { MAX_FILES, PAGE_SIZE } from '@/lib/canvasEngine';
import { useI18n } from '@/lib/i18n';
import type { ConvertedFileItem } from '@/types';
import { FileCard } from './FileCard';

interface BatchListProps {
  items: ConvertedFileItem[];
  onRemoveItems: (ids: string[]) => void;
  onDownload: (id: string) => void;
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 60;

export function BatchList({ items, onRemoveItems, onDownload, disabled }: BatchListProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const selection = useSelection(itemIds);

  const deleteSelected = () => {
    const count = selection.selectedCount;
    onRemoveItems(selection.selectedIds);
    selection.clear();
    showToast(t('msg_deleted', { count }), 'success');
  };
  const layout = useResponsiveLayout();
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);

  const goTo = (next: number) => {
    const clamped = Math.min(Math.max(next, 0), pageCount - 1);
    setDirection(clamped >= page ? 1 : -1);
    setPage(clamped);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) goTo(page + 1);
    else if (info.offset.x > SWIPE_THRESHOLD) goTo(page - 1);
  };

  const start = page * PAGE_SIZE;
  const visible = items.slice(start, start + PAGE_SIZE);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <SelectionActionButton
            selectedCount={selection.selectedCount}
            onSelectAll={selection.selectAll}
            onDeleteSelected={deleteSelected}
            onClearSelection={selection.clear}
            disabled={disabled}
          />
          <h2 className="flex items-center gap-2 text-sm font-bold text-white">
            {t('list_title')}
            <span className="rounded-md border border-neon-cyan/40 px-1.5 font-mono text-xs text-neon-cyan">
              {items.length}/{MAX_FILES}
            </span>
          </h2>
        </div>

        {pageCount > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => goTo(page - 1)}
              disabled={page === 0}
              aria-label="previous"
              className="grid h-7 w-7 place-items-center rounded-lg text-white/60 hover:text-neon-cyan disabled:opacity-25"
            >
              <ChevronIcon direction="left" className="h-4 w-4" glow={false} />
            </button>
            {Array.from({ length: pageCount }, (_, i) => {
              const pageStart = i * PAGE_SIZE + 1;
              const pageEnd = Math.min((i + 1) * PAGE_SIZE, items.length);
              const active = i === page;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  className={`rounded-lg border px-2 py-1 font-mono text-[11px] font-bold transition-all ${
                    active
                      ? 'border-neon-cyan bg-neon-cyan/15 text-neon-cyan shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                      : 'border-white/10 text-white/50 hover:border-neon-purple/50 hover:text-white'
                  }`}
                >
                  {t('list_page', { start: pageStart, end: pageEnd })}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => goTo(page + 1)}
              disabled={page >= pageCount - 1}
              aria-label="next"
              className="grid h-7 w-7 place-items-center rounded-lg text-white/60 hover:text-neon-cyan disabled:opacity-25"
            >
              <ChevronIcon direction="right" className="h-4 w-4" glow={false} />
            </button>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.ul
            key={page}
            custom={direction}
            initial={{ opacity: 0, x: 20 * direction }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 * direction }}
            transition={{ duration: 0.2 }}
            drag={layout !== 'desktop' && pageCount > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={handleDragEnd}
            className="grid grid-cols-1 gap-2.5 max-lg:landscape:grid-cols-2"
          >
            <AnimatePresence initial={false}>
              {visible.map((item, i) => (
                <FileCard
                  key={item.id}
                  item={item}
                  index={start + i}
                  selected={selection.isSelected(item.id)}
                  onToggleSelect={selection.toggle}
                  onDownload={onDownload}
                  disabled={disabled}
                />
              ))}
            </AnimatePresence>
          </motion.ul>
        </AnimatePresence>
      </div>
    </section>
  );
}
