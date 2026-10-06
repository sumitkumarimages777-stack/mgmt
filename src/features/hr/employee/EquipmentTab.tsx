import { useState } from "react";
import { useAssets, useAssignments } from "../../../api";
import { Empty, Icon, Loading } from "../../../components/ui";
import { formatDate } from "../../../lib/dates";
import type { Employee } from "../../../lib/types";
import { useAuth } from "../../auth/AuthContext";
import { AssignAssetModal } from "../equipment/AssignAssetModal";

export function EquipmentTab({ employee }: { employee: Employee }) {
  const { can } = useAuth();
  const assets = useAssets();
  const assignments = useAssignments();
  const [assigning, setAssigning] = useState(false);
  const assetName = (id: string) => {
    const a = assets.data?.find((x) => x.id === id);
    return a ? `${a.name}${a.serial_number ? ` (${a.serial_number})` : ""}` : "—";
  };
  const rows = (assignments.data ?? []).filter((a) => a.employee_id === employee.id);

  return (
    <div className="card">
      <div className="card-head">
        <h2>Equipment</h2>
        {can("hr.equipment", "edit") && (
          <button className="btn btn-sm" onClick={() => setAssigning(true)}><Icon name="plus" size={15} /> Give equipment</button>
        )}
      </div>
      {assignments.isLoading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Empty title="No equipment given" />
      ) : (
        <ul className="list">
          {rows.map((a) => (
            <li key={a.id} className="list-item">
              <div className="grow">
                <div className="cell-title">{assetName(a.asset_id)}</div>
                <div className="cell-sub">
                  Given {formatDate(a.assigned_on)}{a.condition_out ? ` · ${a.condition_out}` : ""}
                  {a.returned_on && ` · Returned ${formatDate(a.returned_on)}${a.condition_in ? ` (${a.condition_in})` : ""}`}
                </div>
              </div>
              <span className={`badge ${a.returned_on ? "badge-gray" : "badge-blue"}`}>{a.returned_on ? "Returned" : "With them"}</span>
            </li>
          ))}
        </ul>
      )}
      {assigning && <AssignAssetModal employeeId={employee.id} onClose={() => setAssigning(false)} />}
    </div>
  );
}
