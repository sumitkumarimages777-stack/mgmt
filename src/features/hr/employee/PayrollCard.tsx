import { useState } from "react";
import { keys, savePayroll, usePayroll, useWrite } from "../../../api";
import { ErrorBox, Loading, TextField } from "../../../components/ui";
import type { Employee, PayrollDetails } from "../../../lib/types";
import { useAuth } from "../../auth/AuthContext";

const FIELDS: Array<[keyof Omit<PayrollDetails, "employee_id">, string]> = [
  ["pan", "PAN"],
  ["uan", "UAN (PF)"],
  ["bank_name", "Bank"],
  ["bank_account", "Account number"],
  ["ifsc", "IFSC"],
];

export function PayrollCard({ employee }: { employee: Employee }) {
  const { can } = useAuth();
  const payroll = usePayroll(employee.id);
  const [draft, setDraft] = useState<PayrollDetails | null>(null);
  const save = useWrite((d: PayrollDetails) => savePayroll(d), [keys.payroll(employee.id)]);
  const current = payroll.data ?? { employee_id: employee.id, pan: null, uan: null, bank_name: null, bank_account: null, ifsc: null };

  return (
    <div className="card card-pad">
      <div className="actions" style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <h2>Payroll details</h2>
        {can("hr.compensation", "edit") && !draft && <button className="btn btn-sm" onClick={() => setDraft(current)}>Edit</button>}
      </div>
      {payroll.isLoading ? (
        <Loading />
      ) : draft ? (
        <div className="form">
          <div className="form-row">
            {FIELDS.map(([k, label]) => (
              <TextField key={k} label={label} value={draft[k]} onChange={(v) => setDraft({ ...draft, [k]: v.trim() || null })} />
            ))}
          </div>
          <div className="actions">
            <button className="btn btn-primary btn-sm" disabled={save.isPending} onClick={() => save.mutate(draft, { onSuccess: () => setDraft(null) })}>Save</button>
            <button className="btn btn-sm" onClick={() => setDraft(null)}>Cancel</button>
          </div>
          <ErrorBox error={save.error} />
        </div>
      ) : (
        <dl className="meta">
          {FIELDS.map(([k, label]) => (
            <div key={k} style={{ display: "contents" }}>
              <dt>{label}</dt>
              <dd>{current[k] || "—"}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
