'use client';

import { useCallback, useMemo, useState } from 'react';

/** Tracks checked ids; ids that disappear from the source list are dropped automatically. */
export function useSelection(ids: string[]) {
  const [rawSelected, setRawSelected] = useState<Set<string>>(() => new Set());

  const selected = useMemo(() => {
    const valid = new Set(ids);
    return new Set([...rawSelected].filter((id) => valid.has(id)));
  }, [ids, rawSelected]);

  const toggle = useCallback((id: string) => {
    setRawSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => setRawSelected(new Set(ids)), [ids]);
  const clear = useCallback(() => setRawSelected(new Set()), []);

  return {
    selected,
    selectedIds: [...selected],
    selectedCount: selected.size,
    isSelected: (id: string) => selected.has(id),
    toggle,
    selectAll,
    clear,
  };
}
