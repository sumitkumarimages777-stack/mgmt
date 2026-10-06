import { useState } from "react";
import { useEsopGrants } from "../../../api";
import { Empty, Icon, Loading } from "../../../components/ui";
import type { Employee } from "../../../lib/types";
import { useAuth } from "../../auth/AuthContext";
import { GrantCard } from "../esop/GrantCard";
import { GrantForm } from "../esop/GrantForm";

export function EsopTab({ employee }: { employee: Employee }) {
  const { can } = useAuth();
  const grants = useEsopGrants();
  const [adding, setAdding] = useState(false);
  const rows = (grants.data ?? []).filter((g) => g.employee_id === employee.id);

  return (
    <div className="grid">
      <div className="actions" style={{ justifyContent: "space-between" }}>
        <h2>ESOP grants</h2>
        {can("hr.esop", "edit") && (
          <button className="btn btn-sm" onClick={() => setAdding(true)}><Icon name="plus" size={15} /> New grant</button>
        )}
      </div>
      {grants.isLoading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <div className="card"><Empty title="No ESOP grants" /></div>
      ) : (
        rows.map((g) => <GrantCard key={g.id} grant={g} exitDate={employee.date_of_exit} />)
      )}
      {adding && <GrantForm employeeId={employee.id} onClose={() => setAdding(false)} />}
    </div>
  );
}
