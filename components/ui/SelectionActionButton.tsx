'use client';

import { NeonButton } from '@/components/ui/NeonButton';
import { CheckIcon, TrashIcon } from '@/components/ui/NeonIcons';
import { useI18n } from '@/lib/i18n';

interface SelectionActionButtonProps {
  selectedCount: number;
  onSelectAll: () => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
  disabled?: boolean;
}

/** Shows "Select all" while nothing is checked and turns into "Delete (n)" once anything is checked. */
export function SelectionActionButton({
  selectedCount,
  onSelectAll,
  onDeleteSelected,
  onClearSelection,
  disabled,
}: SelectionActionButtonProps) {
  const { t } = useI18n();
  const hasSelection = selectedCount > 0;

  return (
    <div className="flex items-center gap-1.5">
      {hasSelection ? (
        <NeonButton variant="danger" size="sm" icon={<TrashIcon />} onClick={onDeleteSelected} disabled={disabled}>
          {t('btn_delete_selected', { count: selectedCount })}
        </NeonButton>
      ) : (
        <NeonButton variant="ghost" size="sm" icon={<CheckIcon />} onClick={onSelectAll} disabled={disabled}>
          {t('btn_select_all')}
        </NeonButton>
      )}
      {hasSelection && (
        <button
          type="button"
          onClick={onClearSelection}
          disabled={disabled}
          className="px-1.5 text-xs text-white/50 underline-offset-4 hover:text-neon-cyan hover:underline disabled:opacity-40"
        >
          {t('btn_clear_selection')}
        </button>
      )}
    </div>
  );
}
