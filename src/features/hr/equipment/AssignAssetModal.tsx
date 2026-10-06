import { useState } from "react";
import { assignAsset, keys, useAssets, useWrite, type AssignInput } from "../../../api";
import { ErrorBox, Modal, SelectField, TextField } from "../../../components/ui";
import { todayISO } from "../../../lib/dates";
import { useEmployeeLookup } from "../useEmployeeLookup";

/** Give an available asset to a team member. Either side can be pre-selected. */
export function AssignAssetModal({ employeeId, assetId, onClose }: { employeeId?: string; assetId?: string; onClose: () => void }) {
  const assets = useAssets();
  const { employees } = useEmployeeLookup();
  const [form, setForm] = useState<AssignInput>({
    asset_id: assetId ?? "", employee_id: employeeId ?? "", assigned_on: todayISO(), condition_out: "", notes: "",
  });
  const set = <K extends keyof AssignInput>(k: K, v: AssignInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const save = useWrite((input: AssignInput) => assignAsset(input), [keys.assets, keys.assignments]);
  const available = (assets.data ?? []).filter((a) => a.status === "available" || a.id === assetId);
  const active = employees.filter((e) => e.status !== "exited" || e.id === employeeId);
  const valid = !!form.asset_id && !!form.employee_id && !!form.assigned_on;

  const submit = () =>
    save.mutate({ ...form, condition_out: form.condition_out?.trim() || null, notes: form.notes?.trim() || null }, { onSuccess: onClose });

  const footer = (
    <>
      <button className="btn" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" disabled={!valid || save.isPending} onClick={submit}>Give equipment</button>
    </>
  );

  return (
    <Modal title="Give equipment" onClose={onClose} footer={footer}>
      <div className="form">
        <SelectField label="Equipment" allowEmpty value={form.asset_id} onChange={(v) => set("asset_id", v)}
          options={available.map((a) => ({ value: a.id, label: `${a.name}${a.serial_number ? ` (${a.serial_number})` : ""}` }))} />
        <SelectField label="Team member" allowEmpty value={form.employee_id} onChange={(v) => set("employee_id", v)}
          options={active.map((e) => ({ value: e.id, label: e.full_name }))} />
        <div className="form-row">
          <TextField label="Given on" type="date" value={form.assigned_on} onChange={(v) => set("assigned_on", v)} />
          <TextField label="Condition" value={form.condition_out} onChange={(v) => set("condition_out", v)} placeholder="e.g. New, with charger" />
        </div>
        <TextField label="Notes" value={form.notes} onChange={(v) => set("notes", v)} />
        {available.length === 0 && <div className="alert alert-info">No available equipment. Add it on the Equipment page first.</div>}
        <ErrorBox error={save.error} />
      </div>
    </Modal>
  );
}
