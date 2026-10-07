import { useCallback, useMemo, useState } from "react";

/** Checkbox selection over a list of rows. Only rows currently shown count as selected. */
export function useRowSelection(visibleIds: string[]) {
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  const selected = useMemo(() => visibleIds.filter((id) => picked.has(id)), [visibleIds, picked]);
  const allSelected = visibleIds.length > 0 && selected.length === visibleIds.length;

  const toggle = useCallback((id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setPicked(allSelected ? new Set() : new Set(visibleIds));
  }, [allSelected, visibleIds]);

  const clear = useCallback(() => setPicked(new Set()), []);

  return { selected, isSelected: (id: string) => picked.has(id), allSelected, toggle, toggleAll, clear };
}

export type RowSelection = ReturnType<typeof useRowSelection>;
