import { useFilings, useRequests } from "../api";
import { filingDueState } from "../lib/dates";
import { useAuth } from "../features/auth/AuthContext";

/** Counts shown next to menu items. Only loads what the user may see. */
export function useNavBadges() {
  const { can } = useAuth();
  const filings = useFilings(can("ca.filings"));
  const requests = useRequests(can("ca.requests"));
  return {
    overdueFilings: (filings.data ?? []).filter((f) => filingDueState(f) === "overdue").length,
    requestsToSend: (requests.data ?? []).filter((r) => r.status === "open" || r.status === "rejected").length,
  };
}
