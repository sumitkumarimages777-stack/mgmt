import { useLookups } from "../../api";
import { Empty, RequestBadge } from "../../components/ui";
import { formatDate } from "../../lib/dates";
import { SectionCard } from "../../components/ui";
import type { DashboardStats } from "./useDashboardStats";

export function RequestsCard({ stats, onOpen }: { stats: DashboardStats; onOpen: (id: string) => void }) {
  const { personName } = useLookups();
  const items = [...stats.pendingOnUs, ...stats.toReview].slice(0, 8);
  return (
    <SectionCard title="Document requests" link={{ to: "/ca/requests", label: "All requests" }}>
      {items.length === 0 ? (
        <Empty title="No open document requests" />
      ) : (
        <ul className="list">
          {items.map((r) => (
            <li key={r.id} className="list-item clickable" onClick={() => onOpen(r.id)}>
              <div className="grow">
                <div className="cell-title">{r.title}</div>
                <div className="cell-sub">
                  Asked by {personName(r.requested_by)}
                  {r.due_date ? ` · needed by ${formatDate(r.due_date)}` : ""}
                </div>
              </div>
              <RequestBadge status={r.status} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
