import { useState } from "react";
import { addSalaryRevision, keys, useWrite, type SalaryInput } from "../../../api";
import { ErrorBox, TextField } from "../../../components/ui";
import { todayISO } from "../../../lib/dates";

export function AddSalaryForm({ employeeId, onDone }: { employeeId: string; onDone: () => void }) {
  const [effective, setEffective] = useState(todayISO());
  const [ctc, setCtc] = useState("");
  const [gross, setGross] = useState("");
  const [notes, setNotes] = useState("");
  const save = useWrite((input: SalaryInput) => addSalaryRevision(input), [keys.allSalaries]);
  const valid = !!effective && Number(ctc) > 0;

  const submit = () =>
    save.mutate(
      { employee_id: employeeId, effective_from: effective, annual_ctc: Number(ctc), monthly_gross: gross ? Number(gross) : null, notes: notes.trim() || null },
      { onSuccess: onDone },
    );

  return (
    <div className="card-pad form" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="form-row">
        <TextField label="Effective from" type="date" value={effective} onChange={setEffective} />
        <TextField label="Annual CTC (₹)" type="number" value={ctc} onChange={setCtc} />
      </div>
      <div className="form-row">
        <TextField label="Monthly gross (₹, optional)" type="number" value={gross} onChange={setGross} />
        <TextField label="Notes" value={notes} onChange={setNotes} placeholder="e.g. Annual appraisal" />
      </div>
      <div className="actions">
        <button className="btn btn-primary btn-sm" disabled={!valid || save.isPending} onClick={submit}>Save</button>
        <button className="btn btn-sm" onClick={onDone}>Cancel</button>
      </div>
      <ErrorBox error={save.error} />
    </div>
  );
}
