import { useState } from "react";
import { deleteSalaryRevision, keys, useSalaryRevisions, useWrite } from "../../../api";
import { Empty, ErrorBox, Icon, Loading } from "../../../components/ui";
import { formatDate } from "../../../lib/dates";
import { formatINR } from "../../../lib/format";
import type { Employee } from "../../../lib/types";
import { useAuth } from "../../auth/AuthContext";
import { AddSalaryForm } from "./AddSalaryForm";

export function SalaryHistory({ employee }: { employee: Employee }) {
  const { can } = useAuth();
  const revisions = useSalaryRevisions(employee.id);
  const [adding, setAdding] = useState(false);
  const remove = useWrite((id: string) => deleteSalaryRevision(id), [keys.salaries(employee.id)]);
  const rows = revisions.data ?? [];

  return (
    <div className="card">
      <div className="card-head">
        <h2>Salary history</h2>
        {can("hr.compensation", "edit") && !adding && (
          <button className="btn btn-sm" onClick={() => setAdding(true)}><Icon name="plus" size={15} /> Add revision</button>
        )}
      </div>
      {adding && <AddSalaryForm employeeId={employee.id} onDone={() => setAdding(false)} />}
      {revisions.isLoading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Empty title="No salary recorded yet" />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Effective from</th><th>Annual CTC</th><th>Monthly gross</th><th>Notes</th><th /></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td className="nowrap">{formatDate(r.effective_from)}{i === 0 && <span className="badge badge-green" style={{ marginLeft: 8 }}>Current</span>}</td>
                  <td className="num">{formatINR(r.annual_ctc)}</td>
                  <td className="num">{formatINR(r.monthly_gross)}</td>
                  <td className="pre">{r.notes || "—"}</td>
                  <td style={{ textAlign: "right" }}>
                    {can("hr.compensation", "manage") && (
                      <button className="btn btn-sm btn-ghost btn-danger" onClick={() => confirm("Delete this salary entry?") && remove.mutate(r.id)}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ErrorBox error={remove.error} />
    </div>
  );
}
