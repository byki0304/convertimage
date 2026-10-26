'use client';

import { AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import { ChevronIcon } from '@/components/ui/NeonIcons';
import { SelectionActionButton } from '@/components/ui/SelectionActionButton';
import { useToast } from '@/components/ui/Toast';
import { useSelection } from '@/hooks/useSelection';
import { MAX_FILES, PAGE_SIZE } from '@/lib/canvasEngine';
import { useI18n } from '@/lib/i18n';
import type { ConvertedFileItem } from '@/types';
import { FileCard } from './FileCard';

interface BatchListProps {
  items: ConvertedFileItem[];
  /** How many files are expanded inside the drop zone; the rest are summarised by `MoreFilesList`. */
  visibleCount: number;
  onRemoveItems: (ids: string[]) => void;
  onDownload: (id: string) => void;
  disabled?: boolean;
}

export function BatchList({ items, visibleCount, onRemoveItems, onDownload, disabled }: BatchListProps) {
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

  return (
    <section className="flex flex-col gap-2">
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

      <ul className="grid grid-cols-1 gap-2 max-lg:landscape:gap-1.5">
        <AnimatePresence initial={false}>
          {items.slice(0, visibleCount).map((item, i) => (
            <FileCard
              key={item.id}
              item={item}
              index={i}
              selected={selection.isSelected(item.id)}
              onToggleSelect={selection.toggle}
              onDownload={onDownload}
              disabled={disabled}
            />
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}

interface MoreFilesListProps {
  items: ConvertedFileItem[];
  visibleCount: number;
  onExpand: (count: number) => void;
  onCollapse: () => void;
}

/** Files beyond the expanded ones, in groups of five; clicking a group's range expands the drop zone to it. */
export function MoreFilesList({ items, visibleCount, onExpand, onCollapse }: MoreFilesListProps) {
  const { t } = useI18n();
  const hiddenCount = Math.max(0, items.length - visibleCount);
  if (hiddenCount === 0 && visibleCount <= PAGE_SIZE) return null;

  const groups: { start: number; end: number; names: string }[] = [];
  for (let start = visibleCount; start < items.length; start += PAGE_SIZE) {
    const group = items.slice(start, start + PAGE_SIZE);
    groups.push({ start: start + 1, end: start + group.length, names: group.map((item) => item.originalName).join(', ') });
  }

  return (
    <div className="flex flex-col gap-1.5">
      {hiddenCount > 0 && <p className="px-1 text-xs text-white/45">{t('list_more', { count: hiddenCount })}</p>}
      {groups.map((group) => (
        <button
          key={group.start}
          type="button"
          onClick={() => onExpand(group.end)}
          className="group flex items-center gap-2.5 rounded-xl border border-white/10 bg-obsidian-card/60 px-3 py-2 text-left transition-all hover:border-neon-cyan/50 hover:shadow-neon-cyan"
        >
          <span className="shrink-0 rounded-md border border-neon-cyan/50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-neon-cyan">
            {t('list_page', { start: group.start, end: group.end })}
          </span>
          <span className="min-w-0 flex-1 truncate text-xs text-white/55">{group.names}</span>
          <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-neon-purple">
            {t('list_expand')}
            <ChevronIcon direction="down" className="h-3.5 w-3.5" glow={false} />
          </span>
        </button>
      ))}
      {visibleCount > PAGE_SIZE && (
        <button
          type="button"
          onClick={onCollapse}
          className="mx-auto flex items-center gap-1 px-2 py-1 text-xs text-white/50 hover:text-neon-cyan"
        >
          <ChevronIcon direction="up" className="h-3.5 w-3.5" glow={false} />
          {t('list_collapse')}
        </button>
      )}
    </div>
  );
}
