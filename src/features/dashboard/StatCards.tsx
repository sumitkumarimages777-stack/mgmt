import { Link } from "react-router-dom";
import { fyLabel } from "../../lib/dates";
import type { DashboardStats } from "./useDashboardStats";

function Stat({ to, label, value, tone }: { to: string; label: string; value: number; tone?: string }) {
  return (
    <Link to={to} className="card stat">
      <div className="stat-label">{label}</div>
      <div className={`stat-value${tone ? ` ${tone}` : ""}`}>{value}</div>
    </Link>
  );
}

export function StatCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-4" style={{ marginBottom: 16 }}>
      <Stat to="/ca/filings?tab=overdue" label="Overdue filings" value={stats.overdue.length} tone={stats.overdue.length ? "red" : undefined} />
      <Stat to="/ca/filings?tab=upcoming" label="Due in next 30 days" value={stats.next30.length} tone={stats.next30.length ? "amber" : undefined} />
      <Stat to="/ca/requests" label="Documents still to send" value={stats.pendingOnUs.length} />
      <Stat to="/ca/filings?tab=filed" label={`Filed in ${fyLabel(stats.fy)}`} value={stats.filedThisFy.length} tone="green" />
    </div>
  );
}
