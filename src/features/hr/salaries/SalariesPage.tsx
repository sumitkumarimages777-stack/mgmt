import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAllSalaryRevisions, useEmployees } from "../../../api";
import { Empty, ErrorBox, Loading, Modal, Tabs } from "../../../components/ui";
import { formatDate } from "../../../lib/dates";
import { formatINR } from "../../../lib/format";
import type { Employee, SalaryRevision } from "../../../lib/types";
import { useAuth } from "../../auth/AuthContext";
import { AddSalaryForm } from "../employee/AddSalaryForm";

type Filter = "missing" | "all";

/** Current salary for every active team member, and a quick way to fill in missing ones. */
export function SalariesPage() {
  const { can } = useAuth();
  const employees = useEmployees();
  const salaries = useAllSalaryRevisions();
  const [filter, setFilter] = useState<Filter>("all");
  const [adding, setAdding] = useState<Employee | null>(null);

  const rows = useMemo(() => {
    const latest = new Map<string, SalaryRevision>();
    for (const s of salaries.data ?? []) if (!latest.has(s.employee_id)) latest.set(s.employee_id, s); // newest first
    return (employees.data ?? []).filter((e) => e.status !== "exited").map((e) => ({ employee: e, salary: latest.get(e.id) ?? null }));
  }, [employees.data, salaries.data]);
  const missing = rows.filter((r) => !r.salary);
  const shown = filter === "missing" ? missing : rows;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Salaries</h1>
          <p>Current salary of everyone on the team. CA uses these for TDS.</p>
        </div>
      </div>
      <div className="toolbar">
        <Tabs
          value={filter}
          onChange={setFilter}
          items={[
            { value: "all", label: "Everyone", count: rows.length },
            { value: "missing", label: "No salary yet", count: missing.length },
          ]}
        />
      </div>
      <div className="card">
        <ErrorBox error={employees.error ?? salaries.error} />
        {employees.isLoading || salaries.isLoading ? (
          <Loading />
        ) : shown.length === 0 ? (
          <Empty title={filter === "missing" ? "Everyone has a salary recorded" : "No team members yet"} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Team member</th><th>Annual CTC</th><th>Monthly gross</th><th>Effective from</th><th /></tr>
              </thead>
              <tbody>
                {shown.map(({ employee: e, salary: s }) => (
                  <tr key={e.id}>
                    <td>
                      <Link to={`/hr/team/${e.id}`} className="cell-title">{e.full_name}</Link>
                      <div className="cell-sub">{[e.designation, e.department].filter(Boolean).join(" · ") || "—"}</div>
                    </td>
                    <td className="num">{s ? formatINR(s.annual_ctc) : <span className="badge badge-amber">Not set</span>}</td>
                    <td className="num">{s ? formatINR(s.monthly_gross ?? Math.round(s.annual_ctc / 12)) : "—"}</td>
                    <td className="nowrap">{formatDate(s?.effective_from)}</td>
                    <td style={{ textAlign: "right" }}>
                      {can("hr.compensation", "edit") && (
                        <button className="btn btn-sm" onClick={() => setAdding(e)}>{s ? "Revise" : "Add salary"}</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {adding && (
        <Modal title={`Salary · ${adding.full_name}`} onClose={() => setAdding(null)}>
          <AddSalaryForm employeeId={adding.id} onDone={() => setAdding(null)} />
        </Modal>
      )}
    </div>
  );
}
