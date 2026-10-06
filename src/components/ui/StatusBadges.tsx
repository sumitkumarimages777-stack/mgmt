import { filingDueState, relativeDue, type DueState } from "../../lib/dates";
import { FILING_STATUS_LABEL, REQUEST_STATUS_LABEL } from "../../lib/labels";
import type { Filing, RequestStatus } from "../../lib/types";

type DueFields = Pick<Filing, "status" | "due_date">;

const DUE_BADGE: Record<DueState, [string, string]> = {
  overdue: ["badge-red", "Overdue"],
  due_soon: ["badge-amber", "Due soon"],
  upcoming: ["badge-gray", "Upcoming"],
  filed: ["badge-green", "Filed"],
  not_applicable: ["badge-gray", "N/A"],
};

export function FilingBadge({ filing }: { filing: DueFields }) {
  const state = filingDueState(filing);
  const [cls, label] = DUE_BADGE[state];
  const inProgress = filing.status === "in_progress" && (state === "upcoming" || state === "due_soon");
  return <span className={`badge ${cls}`}>{inProgress ? FILING_STATUS_LABEL.in_progress : label}</span>;
}

/** "in 3 days" / "5 days late" under a due date; nothing once filed. */
export function DueText({ filing }: { filing: DueFields }) {
  const state = filingDueState(filing);
  if (state === "filed" || state === "not_applicable") return null;
  return (
    <div className="cell-sub" style={state === "overdue" ? { color: "var(--red)" } : undefined}>
      {relativeDue(filing.due_date)}
    </div>
  );
}

const REQUEST_BADGE: Record<RequestStatus, string> = {
  open: "badge-amber",
  submitted: "badge-blue",
  accepted: "badge-green",
  rejected: "badge-red",
  cancelled: "badge-gray",
};

export function RequestBadge({ status }: { status: RequestStatus }) {
  return <span className={`badge ${REQUEST_BADGE[status]}`}>{REQUEST_STATUS_LABEL[status]}</span>;
}
