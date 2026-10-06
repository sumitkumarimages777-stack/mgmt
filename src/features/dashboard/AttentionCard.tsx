import { Empty, FilingBadge } from "../../components/ui";
import { formatDate, relativeDue } from "../../lib/dates";
import { SectionCard } from "../../components/ui";
import type { DashboardStats } from "./useDashboardStats";

export function AttentionCard({ stats, canEdit, onOpen }: { stats: DashboardStats; canEdit: boolean; onOpen: (id: string) => void }) {
  const items = [...stats.overdue, ...stats.next30].slice(0, 8);
  return (
    <SectionCard title="Filings needing attention" link={{ to: "/ca/filings", label: "All filings" }}>
      {items.length === 0 ? (
        <Empty title="Nothing due in the next 30 days">
          {stats.filings.length === 0 && canEdit && "Go to Filings to generate this year's compliance calendar."}
        </Empty>
      ) : (
        <ul className="list">
          {items.map((f) => (
            <li key={f.id} className="list-item clickable" onClick={() => onOpen(f.id)}>
              <div className="grow">
                <div className="cell-title">{f.title}{f.period && <span className="muted"> · {f.period}</span>}</div>
                <div className="cell-sub">{formatDate(f.due_date)} · {relativeDue(f.due_date, stats.today)}</div>
              </div>
              <FilingBadge filing={f} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
