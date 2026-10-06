import { useState } from "react";
import { useEsopGrants } from "../../../api";
import { Empty, Icon, Loading } from "../../../components/ui";
import { todayISO } from "../../../lib/dates";
import { formatCount } from "../../../lib/format";
import { useAuth } from "../../auth/AuthContext";
import { useEmployeeLookup } from "../useEmployeeLookup";
import { GrantForm } from "./GrantForm";
import { GrantsTable } from "./GrantsTable";
import { vestedOptions } from "./vesting";

export function EsopPage() {
  const { can } = useAuth();
  const grants = useEsopGrants();
  const { employees } = useEmployeeLookup();
  const [adding, setAdding] = useState(false);
  const today = todayISO();
  const exitOf = (id: string) => employees.find((e) => e.id === id)?.date_of_exit ?? null;
  const active = (grants.data ?? []).filter((g) => g.status === "active");
  const granted = active.reduce((n, g) => n + g.options, 0);
  const vested = active.reduce((n, g) => n + vestedOptions(g, today, exitOf(g.employee_id)), 0);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>ESOPs</h1>
          <p>Option grants and how much has vested. Vesting is worked out automatically from each grant's schedule.</p>
        </div>
        {can("hr.esop", "edit") && (
          <button className="btn btn-primary" onClick={() => setAdding(true)}><Icon name="plus" size={16} /> New grant</button>
        )}
      </div>
      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="card stat"><div className="stat-label">Options granted</div><div className="stat-value">{formatCount(granted)}</div></div>
        <div className="card stat"><div className="stat-label">Vested today</div><div className="stat-value green">{formatCount(vested)}</div></div>
        <div className="card stat"><div className="stat-label">Unvested</div><div className="stat-value">{formatCount(granted - vested)}</div></div>
        <div className="card stat"><div className="stat-label">People with grants</div><div className="stat-value">{new Set(active.map((g) => g.employee_id)).size}</div></div>
      </div>
      <div className="card">
        {grants.isLoading ? <Loading /> : (grants.data ?? []).length === 0 ? <Empty title="No grants yet" /> : <GrantsTable grants={grants.data ?? []} exitOf={exitOf} />}
      </div>
      {adding && <GrantForm onClose={() => setAdding(false)} />}
    </div>
  );
}
