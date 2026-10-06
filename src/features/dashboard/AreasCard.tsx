import { useLookups } from "../../api";
import { AreaTag } from "../../components/ui";
import { filingDueState } from "../../lib/dates";
import { DashboardCard } from "./DashboardCard";
import type { DashboardStats } from "./useDashboardStats";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function AreasCard({ stats }: { stats: DashboardStats }) {
  const { areas } = useLookups();
  return (
    <DashboardCard
      title="Areas"
      aside={<span className="faint small">{plural(stats.sharedThisMonth, "document")} shared this month</span>}
    >
      <ul className="list">
        {areas.map((a) => {
          const late = stats.filings.filter((f) => f.area_id === a.id && filingDueState(f, stats.today) === "overdue").length;
          const open = stats.pendingOnUs.filter((r) => r.area_id === a.id).length;
          return (
            <li key={a.id} className="list-item">
              <div className="grow">
                <AreaTag area={a} />
                <div className="cell-sub">{a.description}</div>
              </div>
              <div className="small muted nowrap" style={{ textAlign: "right" }}>
                {late > 0 && <div style={{ color: "var(--red)" }}>{late} overdue</div>}
                <div>{plural(open, "doc request")} open</div>
              </div>
            </li>
          );
        })}
      </ul>
    </DashboardCard>
  );
}
