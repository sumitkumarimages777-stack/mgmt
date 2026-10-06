import { useState } from "react";
import { keys, saveMatter, useWrite, type MatterInput } from "../../../api";
import { ErrorBox, Modal, SelectField, TextField } from "../../../components/ui";
import { todayISO } from "../../../lib/dates";
import { optionsFrom } from "../../../lib/options";
import type { LegalMatter, MatterType } from "../../../lib/types";
import { MATTER_TYPE_LABEL } from "../labels";

const clean = (v: string | null | undefined) => (v ? v : null);

export function MatterForm({ matter, onClose }: { matter?: LegalMatter; onClose: () => void }) {
  const [f, setF] = useState<MatterInput>(matter ?? { title: "", matter_type: "notice_received", status: "open", opened_on: todayISO() });
  const set = <K extends keyof MatterInput>(k: K, v: MatterInput[K]) => setF((x) => ({ ...x, [k]: v }));
  const save = useWrite((x: MatterInput) => saveMatter(matter?.id ?? null, {
    title: x.title?.trim(), matter_type: x.matter_type, counterparty: clean(x.counterparty), status: x.status,
    opened_on: x.opened_on || todayISO(), closed_on: x.status === "closed" ? x.closed_on || todayISO() : null,
    next_date: clean(x.next_date), next_action: clean(x.next_action), description: clean(x.description),
  }), [keys.matters]);

  const footer = (
    <>
      <button className="btn" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" disabled={!f.title?.trim() || save.isPending} onClick={() => save.mutate(f, { onSuccess: onClose })}>Save</button>
    </>
  );

  return (
    <Modal title={matter ? "Edit matter" : "Add notice / matter"} onClose={onClose} footer={footer}>
      <div className="form">
        <TextField label="Title" value={f.title} onChange={(v) => set("title", v)} placeholder="e.g. GST show-cause notice FY 2024-25" />
        <div className="form-row">
          <SelectField label="Type" value={f.matter_type} onChange={(v) => set("matter_type", v as MatterType)} options={optionsFrom(MATTER_TYPE_LABEL)} />
          <TextField label="Counterparty / authority" value={f.counterparty} onChange={(v) => set("counterparty", v)} />
        </div>
        <div className="form-row">
          <TextField label="Next date (hearing / reply due)" type="date" value={f.next_date} onChange={(v) => set("next_date", v)} />
          <TextField label="Next action" value={f.next_action} onChange={(v) => set("next_action", v)} placeholder="e.g. File reply" />
        </div>
        <div className="form-row">
          <TextField label="Opened on" type="date" value={f.opened_on} onChange={(v) => set("opened_on", v)} />
          <SelectField label="Status" value={f.status} onChange={(v) => set("status", v as "open" | "closed")} options={[{ value: "open", label: "Open" }, { value: "closed", label: "Closed" }]} />
        </div>
        <label className="field">
          <span>Details</span>
          <textarea className="textarea" value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} />
        </label>
        <ErrorBox error={save.error} />
      </div>
    </Modal>
  );
}
