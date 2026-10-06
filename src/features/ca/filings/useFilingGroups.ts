import { useMemo } from "react";
import { filingDueState, todayISO } from "../../../lib/dates";
import type { Filing } from "../../../lib/types";

export type FilingTab = "upcoming" | "overdue" | "filed" | "all";

/** Filter filings by category/search and bucket them into the page's tabs. */
export function useFilingGroups(filings: Filing[] | undefined, category: string, query: string) {
  return useMemo(() => {
    const today = todayISO();
    const q = query.toLowerCase();
    const all = (filings ?? []).filter(
      (f) => (!category || f.category === category) && (!q || `${f.title} ${f.form_code ?? ""} ${f.period}`.toLowerCase().includes(q)),
    );
    const state = (f: Filing) => filingDueState(f, today);
    return {
      upcoming: all.filter((f) => state(f) === "upcoming" || state(f) === "due_soon"),
      overdue: all.filter((f) => state(f) === "overdue"),
      filed: all
        .filter((f) => f.status === "filed" || f.status === "not_applicable")
        .sort((a, b) => b.due_date.localeCompare(a.due_date)),
      all,
    } satisfies Record<FilingTab, Filing[]>;
  }, [filings, category, query]);
}
