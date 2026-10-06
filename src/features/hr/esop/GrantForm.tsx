import { useState } from "react";
import { deleteGrant, keys, saveGrant, useWrite, type GrantInput } from "../../../api";
import { ErrorBox, Modal, SelectField, TextField } from "../../../components/ui";
import { optionsFrom } from "../../../lib/options";
import { todayISO } from "../../../lib/dates";
import type { EsopGrant, VestingFrequency } from "../../../lib/types";
import { useAuth } from "../../auth/AuthContext";
import { VESTING_FREQUENCY_LABEL } from "../labels";
import { useEmployeeLookup } from "../useEmployeeLookup";

const NEW: GrantInput = {
  grant_date: todayISO(), vesting_start: todayISO(), options: undefined, exercise_price: 0,
  vesting_months: 48, cliff_months: 12, vesting_frequency: "monthly", status: "active",
};

export function GrantForm({ grant, employeeId, onClose }: { grant?: EsopGrant; employeeId?: string; onClose: () => void }) {
  const { can } = useAuth();
  const { employees } = useEmployeeLookup();
  const [f, setF] = useState<GrantInput>(grant ?? { ...NEW, employee_id: employeeId });
  const set = <K extends keyof GrantInput>(k: K, v: GrantInput[K]) => setF((x) => ({ ...x, [k]: v }));
  const num = (v: string) => (v === "" ? undefined : Number(v));
  const save = useWrite((x: GrantInput) => saveGrant(grant?.id ?? null, {
    employee_id: x.employee_id, grant_date: x.grant_date, options: x.options, exercise_price: x.exercise_price ?? 0,
    vesting_start: x.vesting_start, vesting_months: x.vesting_months, cliff_months: x.cliff_months,
    vesting_frequency: x.vesting_frequency, status: x.status, notes: x.notes || null,
  }), [keys.esop]);
  const remove = useWrite(() => deleteGrant(grant!.id), [keys.esop]);
  const valid = !!f.employee_id && (f.options ?? 0) > 0 && !!f.grant_date && !!f.vesting_start && (f.vesting_months ?? 0) > 0
    && (f.cliff_months ?? 0) >= 0 && (f.cliff_months ?? 0) <= (f.vesting_months ?? 0);

  const footer = (
    <>
      {grant && can("hr.esop", "manage") && (
        <button className="btn btn-ghost btn-danger" onClick={() => confirm("Delete this grant?") && remove.mutate(undefined, { onSuccess: onClose })}>Delete</button>
      )}
      <span className="spacer" />
      <button className="btn" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" disabled={!valid || save.isPending} onClick={() => save.mutate(f, { onSuccess: onClose })}>Save</button>
    </>
  );

  return (
    <Modal title={grant ? "Edit ESOP grant" : "New ESOP grant"} onClose={onClose} footer={footer}>
      <div className="form">
        {!employeeId && (
          <SelectField label="Team member" allowEmpty value={f.employee_id} onChange={(v) => set("employee_id", v)}
            options={employees.map((e) => ({ value: e.id, label: e.full_name }))} />
        )}
        <div className="form-row">
          <TextField label="Options granted" type="number" value={f.options?.toString()} onChange={(v) => set("options", num(v))} />
          <TextField label="Exercise price per option (₹)" type="number" value={f.exercise_price?.toString()} onChange={(v) => set("exercise_price", num(v))} />
        </div>
        <div className="form-row">
          <TextField label="Grant date" type="date" value={f.grant_date} onChange={(v) => set("grant_date", v)} />
          <TextField label="Vesting starts" type="date" value={f.vesting_start} onChange={(v) => set("vesting_start", v)} />
        </div>
        <div className="form-row">
          <TextField label="Vesting period (months)" type="number" value={f.vesting_months?.toString()} onChange={(v) => set("vesting_months", num(v))} />
          <TextField label="Cliff (months)" type="number" value={f.cliff_months?.toString()} onChange={(v) => set("cliff_months", num(v))} hint="Nothing vests before the cliff." />
        </div>
        <div className="form-row">
          <SelectField label="Vests" value={f.vesting_frequency} onChange={(v) => set("vesting_frequency", v as VestingFrequency)} options={optionsFrom(VESTING_FREQUENCY_LABEL)} />
          <SelectField label="Status" value={f.status} onChange={(v) => set("status", v as "active" | "cancelled")} options={[{ value: "active", label: "Active" }, { value: "cancelled", label: "Cancelled" }]} />
        </div>
        <TextField label="Notes" value={f.notes} onChange={(v) => set("notes", v)} placeholder="e.g. Board resolution date, plan name" />
        <ErrorBox error={save.error ?? remove.error} />
      </div>
    </Modal>
  );
}
