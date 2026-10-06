import { useDocuments, useFilings, useRequests } from "../../api";
import { useAuth } from "../auth/AuthContext";
import { addDays, filingDueState, fyStartYear, todayISO } from "../../lib/dates";

/** Numbers and lists the dashboard shows, computed from what the user can see. */
export function useDashboardStats() {
  const { can } = useAuth();
  const filings = useFilings(can("ca.filings"));
  const requests = useRequests(can("ca.requests"));
  const documents = useDocuments(can("ca.documents"));

  const today = todayISO();
  const in30 = addDays(today, 30);
  const fy = fyStartYear(today);
  const all = filings.data ?? [];
  const reqs = requests.data ?? [];

  const overdue = all.filter((f) => filingDueState(f, today) === "overdue");
  const next30 = all.filter((f) => {
    const s = filingDueState(f, today);
    return (s === "due_soon" || s === "upcoming") && f.due_date <= in30;
  });
  const filedThisFy = all.filter(
    (f) => f.status === "filed" && (f.filed_on ?? f.updated_at.slice(0, 10)) >= `${fy}-04-01`,
  );
  const pendingOnUs = reqs.filter((r) => r.status === "open" || r.status === "rejected");
  const toReview = reqs.filter((r) => r.status === "submitted");
  const sharedThisMonth = (documents.data ?? []).filter((d) => d.created_at.slice(0, 7) === today.slice(0, 7)).length;

  return {
    loading: filings.isLoading || requests.isLoading,
    today, fy, filings: all, requests: reqs,
    overdue, next30, filedThisFy, pendingOnUs, toReview, sharedThisMonth,
  };
}

export type DashboardStats = ReturnType<typeof useDashboardStats>;
