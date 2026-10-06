import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteEmployee, keys, useLookups, useWrite } from "../../../api";
import { ErrorBox } from "../../../components/ui";
import { formatDate } from "../../../lib/dates";
import type { Employee } from "../../../lib/types";
import { useAuth } from "../../auth/AuthContext";
import { EMPLOYMENT_TYPE_LABEL } from "../labels";
import { EmployeeForm } from "../team/EmployeeForm";
import { useEmployeeLookup } from "../useEmployeeLookup";

export function OverviewTab({ employee: e }: { employee: Employee }) {
  const { can } = useAuth();
  const navigate = useNavigate();
  const { employeeName } = useEmployeeLookup();
  const { personName } = useLookups();
  const [editing, setEditing] = useState(false);
  const remove = useWrite(() => deleteEmployee(e.id), [keys.employees]);
  const rows: Array<[string, string]> = [
    ["Employee code", e.employee_code || "—"],
    ["Type", EMPLOYMENT_TYPE_LABEL[e.employment_type]],
    ["Joined", formatDate(e.date_of_joining)],
    ["Exit date", formatDate(e.date_of_exit)],
    ["Reports to", employeeName(e.manager_id)],
    ["Work email", e.work_email || "—"],
    ["Phone", e.phone || "—"],
    ["Personal email", e.personal_email || "—"],
    ["Date of birth", formatDate(e.date_of_birth)],
    ["Address", e.address || "—"],
    ["Emergency contact", e.emergency_contact || "—"],
    ["Panel login", e.profile_id ? personName(e.profile_id) : "Not linked"],
  ];

  const confirmDelete = () => {
    if (confirm(`Delete ${e.full_name} and all their HR records (salary, ESOPs, equipment history)? This cannot be undone.`)) {
      remove.mutate(undefined, { onSuccess: () => navigate("/hr/team") });
    }
  };

  return (
    <div className="card card-pad">
      <dl className="meta">
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: "contents" }}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
        {e.notes && (<><dt>Notes</dt><dd className="pre">{e.notes}</dd></>)}
      </dl>
      <div className="actions" style={{ marginTop: 16 }}>
        {can("hr.team", "edit") && <button className="btn" onClick={() => setEditing(true)}>Edit details</button>}
        {can("hr.team", "manage") && <button className="btn btn-ghost btn-danger" onClick={confirmDelete}>Delete</button>}
      </div>
      <ErrorBox error={remove.error} />
      {editing && <EmployeeForm employee={e} onClose={() => setEditing(false)} />}
    </div>
  );
}
