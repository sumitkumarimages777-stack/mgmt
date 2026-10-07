import { useState } from "react";
import { deleteTdsRule, keys, saveTdsRule, useWrite, type TdsRuleInput } from "../../../api";
import { ErrorBox, Modal, SelectField, TextField } from "../../../components/ui";
import type { EmploymentType, TdsBasis, TdsRule } from "../../../lib/types";
import { useAuth } from "../../auth/AuthContext";
import { EMPLOYMENT_TYPE_LABEL } from "../../hr/labels";

const EMPTY: TdsRuleInput = {
  name: "", section: "192", basis: "annual", threshold: 0, rate_percent: null, employment_types: null, is_active: true, notes: null,
};
// Only the editable columns (the row also carries timestamps).
const pickInput = ({ name, section, basis, threshold, rate_percent, employment_types, is_active, notes }: TdsRule): TdsRuleInput => ({
  name, section, basis, threshold, rate_percent, employment_types, is_active, notes,
});
const TYPES = Object.keys(EMPLOYMENT_TYPE_LABEL) as EmploymentType[];

export function TdsRuleModal({ rule, onClose }: { rule: TdsRule | null; onClose: () => void }) {
  const { can } = useAuth();
  const editable = can("ca.tds_rules", "edit");
  const [form, setForm] = useState<TdsRuleInput>(() => (rule ? pickInput(rule) : EMPTY));
  const [threshold, setThreshold] = useState(rule ? String(rule.threshold) : "");
  const [rate, setRate] = useState(rule?.rate_percent == null ? "" : String(rule.rate_percent));
  const set = <K extends keyof TdsRuleInput>(k: K, v: TdsRuleInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const save = useWrite((input: TdsRuleInput) => saveTdsRule(rule?.id ?? null, input), [keys.tdsRules]);
  const remove = useWrite(() => deleteTdsRule(rule!.id), [keys.tdsRules]);
  const types = form.employment_types ?? [];
  const valid = form.name.trim() && form.section.trim() && threshold !== "" && Number(threshold) >= 0;

  const toggleType = (t: EmploymentType) => {
    const next = types.includes(t) ? types.filter((x) => x !== t) : [...types, t];
    set("employment_types", next.length ? next : null);
  };
  const submit = () =>
    save.mutate(
      { ...form, name: form.name.trim(), section: form.section.trim(), threshold: Number(threshold), rate_percent: rate === "" ? null : Number(rate), notes: form.notes?.trim() || null },
      { onSuccess: onClose },
    );

  const footer = (
    <>
      {rule && can("ca.tds_rules", "manage") && (
        <button className="btn btn-ghost btn-danger" disabled={remove.isPending} onClick={() => confirm("Delete this rule?") && remove.mutate(undefined, { onSuccess: onClose })}>
          Delete
        </button>
      )}
      <span className="spacer" />
      <button className="btn" onClick={onClose}>{editable ? "Cancel" : "Close"}</button>
      {editable && <button className="btn btn-primary" disabled={!valid || save.isPending} onClick={submit}>Save</button>}
    </>
  );

  return (
    <Modal title={rule ? "Edit TDS rule" : "New TDS rule"} onClose={onClose} footer={footer}>
      <fieldset disabled={!editable} className="form plain-fieldset">
        <div className="form-row">
          <TextField label="Name" value={form.name} onChange={(v) => set("name", v)} placeholder="e.g. Salary TDS" />
          <TextField label="Section" value={form.section} onChange={(v) => set("section", v)} hint="192 for salary, 194J for professional fees…" />
        </div>
        <div className="form-row">
          <TextField label="Salary above (₹)" type="number" value={threshold} onChange={setThreshold} />
          <SelectField
            label="Measured as"
            value={form.basis}
            onChange={(v) => set("basis", v as TdsBasis)}
            options={[{ value: "annual", label: "Annual CTC" }, { value: "monthly", label: "Monthly gross" }]}
          />
        </div>
        <TextField label="Default TDS rate % (optional)" type="number" value={rate} onChange={setRate} hint="Pre-fills the monthly amount; you can change it per person." />
        <div className="field">
          <span>Applies to</span>
          <div className="actions">
            {TYPES.map((t) => (
              <label key={t} className="check"><input type="checkbox" checked={types.includes(t)} onChange={() => toggleType(t)} /> {EMPLOYMENT_TYPE_LABEL[t]}</label>
            ))}
          </div>
          <small>Leave all unticked to apply to everyone.</small>
        </div>
        <label className="check"><input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} /> Rule is active</label>
        <TextField label="Notes" value={form.notes} onChange={(v) => set("notes", v)} />
        <ErrorBox error={save.error ?? remove.error} />
      </fieldset>
    </Modal>
  );
}
