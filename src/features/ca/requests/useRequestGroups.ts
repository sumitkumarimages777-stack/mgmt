import { useMemo } from "react";
import type { DocumentRequest } from "../../../lib/types";

export type RequestTab = "pending" | "review" | "closed" | "all";

export function useRequestGroups(requests: DocumentRequest[] | undefined, query: string) {
  return useMemo(() => {
    const q = query.toLowerCase();
    const all = (requests ?? []).filter(
      (r) => !q || `${r.title} ${r.description ?? ""}`.toLowerCase().includes(q),
    );
    return {
      pending: all.filter((r) => r.status === "open" || r.status === "rejected"),
      review: all.filter((r) => r.status === "submitted"),
      closed: all.filter((r) => r.status === "accepted" || r.status === "cancelled"),
      all,
    } satisfies Record<RequestTab, DocumentRequest[]>;
  }, [requests, query]);
}
