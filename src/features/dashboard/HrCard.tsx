import { Link } from "react-router-dom";
import { useAssignments, useEmployees } from "../../api";
import { Empty } from "../../components/ui";
import { formatDate, todayISO } from "../../lib/dates";
import { useAuth } from "../auth/AuthContext";
import { DashboardCard } from "./DashboardCard";

/** HR at a glance for HR staff; a link to "my record" for everyone else with own access. */
export function HrCard() {
  const { can, profile } = useAuth();
  const employees = useEmployees();
  const assignments = useAssignments(can("hr.equipment"));
  const all = employees.data ?? [];

  if (!can("hr.team", "view")) {
    const mine = all.find((e) => e.profile_id === profile?.id);
    return (
      <DashboardCard title="My HR record">
        {mine ? (
          <div className="card-pad"><Link to={`/hr/team/${mine.id}`}>Open my details, documents, equipment and ESOPs →</Link></div>
        ) : (
          <Empty title="Not linked yet">Ask HR to link your HR record to your login.</Empty>
        )}
      </DashboardCard>
    );
  }

  const month = todayISO().slice(0, 7);
  const active = all.filter((e) => e.status !== "exited");
  const joiners = all.filter((e) => e.date_of_joining?.slice(0, 7) === month);
  const rows: Array<[string, number]> = [
    ["Active team", active.length],
    ["On notice", all.filter((e) => e.status === "on_notice").length],
    ["Joined this month", joiners.length],
  ];
  if (can("hr.equipment")) rows.push(["Equipment with people", (assignments.data ?? []).filter((a) => !a.returned_on).length]);

  return (
    <DashboardCard title="HR" link={{ to: "/hr/team", label: "Team" }}>
      <ul className="list">
        {rows.map(([label, n]) => (
          <li key={label} className="list-item">
            <div className="grow">{label}</div>
            <strong className="num">{n}</strong>
          </li>
        ))}
        {joiners.map((e) => (
          <li key={e.id} className="list-item">
            <div className="grow cell-sub">New: {e.full_name}{e.designation ? `, ${e.designation}` : ""}</div>
            <span className="faint small">{formatDate(e.date_of_joining)}</span>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
