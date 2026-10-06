import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useEmployees } from "../../../api";
import { Empty, Icon, Loading, Tabs } from "../../../components/ui";
import type { EmployeeStatus } from "../../../lib/types";
import { useAuth } from "../../auth/AuthContext";
import { EmployeeForm } from "./EmployeeForm";
import { TeamTable } from "./TeamTable";

type Filter = EmployeeStatus | "all";

export function TeamPage() {
  const { can, profile } = useAuth();
  const employees = useEmployees();
  const [filter, setFilter] = useState<Filter>("active");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const all = useMemo(() => employees.data ?? [], [employees.data]);

  const rows = useMemo(() => {
    const text = q.toLowerCase();
    return all.filter(
      (e) =>
        (filter === "all" || e.status === filter) &&
        (!text || `${e.full_name} ${e.designation ?? ""} ${e.department ?? ""} ${e.employee_code ?? ""}`.toLowerCase().includes(text)),
    );
  }, [all, filter, q]);

  // People who can only see their own record go straight to it.
  if (!can("hr.team", "view")) {
    const mine = all.find((e) => e.profile_id === profile?.id);
    if (employees.isLoading) return <div className="page"><Loading /></div>;
    if (mine) return <Navigate to={`/hr/team/${mine.id}`} replace />;
    return <div className="page"><div className="card"><Empty title="Your HR record hasn't been set up yet">Ask HR to link it to your login.</Empty></div></div>;
  }

  const count = (s: EmployeeStatus) => all.filter((e) => e.status === s).length;
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Team members</h1>
          <p>Everyone who works with the company — employees, interns, contractors and consultants.</p>
        </div>
        {can("hr.team", "edit") && (
          <button className="btn btn-primary" onClick={() => setAdding(true)}>
            <Icon name="plus" size={16} /> Add team member
          </button>
        )}
      </div>
      <div className="toolbar">
        <Tabs
          value={filter}
          onChange={setFilter}
          items={[
            { value: "active", label: "Active", count: count("active") },
            { value: "on_notice", label: "On notice", count: count("on_notice") },
            { value: "exited", label: "Exited", count: count("exited") },
            { value: "all", label: "All", count: all.length },
          ]}
        />
        <input className="input search" placeholder="Search name, role, department…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="card">
        {employees.isLoading ? <Loading /> : rows.length === 0 ? <Empty title="No team members here" /> : <TeamTable rows={rows} />}
      </div>
      {adding && <EmployeeForm onClose={() => setAdding(false)} />}
    </div>
  );
}
