import { useState } from "react";
import { keys, saveContract, useProfiles, useWrite, type ContractInput } from "../../../api";
import { ErrorBox, Modal, SelectField, TextField } from "../../../components/ui";
import { optionsFrom } from "../../../lib/options";
import type { Contract, ContractStatus } from "../../../lib/types";
import { CONTRACT_STATUS_LABEL, CONTRACT_TYPES } from "../labels";

const clean = (v: string | null | undefined) => (v ? v : null);

export function ContractForm({ contract, onClose }: { contract?: Contract; onClose: () => void }) {
  const profiles = useProfiles();
  const [f, setF] = useState<ContractInput>(contract ?? { title: "", contract_type: CONTRACT_TYPES[0], status: "draft" });
  const set = <K extends keyof ContractInput>(k: K, v: ContractInput[K]) => setF((x) => ({ ...x, [k]: v }));
  const save = useWrite((x: ContractInput) => saveContract(contract?.id ?? null, {
    title: x.title?.trim(), contract_type: x.contract_type, counterparty: clean(x.counterparty), status: x.status,
    start_date: clean(x.start_date), end_date: clean(x.end_date), renewal_notice_days: x.renewal_notice_days ?? null,
    value: x.value ?? null, owner_id: clean(x.owner_id), notes: clean(x.notes),
  }), [keys.contracts]);
  const num = (v: string) => (v === "" ? null : Number(v));

  const footer = (
    <>
      <button className="btn" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" disabled={!f.title?.trim() || save.isPending} onClick={() => save.mutate(f, { onSuccess: onClose })}>Save</button>
    </>
  );

  return (
    <Modal title={contract ? "Edit contract" : "Add contract"} onClose={onClose} footer={footer}>
      <div className="form">
        <TextField label="Title" value={f.title} onChange={(v) => set("title", v)} placeholder="e.g. Office lease — Sector 62" />
        <div className="form-row">
          <SelectField label="Type" value={f.contract_type} onChange={(v) => set("contract_type", v)} options={CONTRACT_TYPES.map((t) => ({ value: t, label: t }))} />
          <TextField label="Counterparty" value={f.counterparty} onChange={(v) => set("counterparty", v)} placeholder="Other party's name" />
        </div>
        <div className="form-row">
          <TextField label="Start date" type="date" value={f.start_date} onChange={(v) => set("start_date", v)} />
          <TextField label="End / expiry date" type="date" value={f.end_date} onChange={(v) => set("end_date", v)} />
        </div>
        <div className="form-row">
          <TextField label="Renewal notice (days before end)" type="number" value={f.renewal_notice_days?.toString()} onChange={(v) => set("renewal_notice_days", num(v))} hint="You'll be reminded when this window opens." />
          <TextField label="Value (₹)" type="number" value={f.value?.toString()} onChange={(v) => set("value", num(v))} />
        </div>
        <div className="form-row">
          <SelectField label="Status" value={f.status} onChange={(v) => set("status", v as ContractStatus)} options={optionsFrom(CONTRACT_STATUS_LABEL)} />
          <SelectField label="Owner" allowEmpty value={f.owner_id} onChange={(v) => set("owner_id", v || null)}
            options={(profiles.data ?? []).map((p) => ({ value: p.id, label: p.full_name || p.email }))} />
        </div>
        <TextField label="Notes" value={f.notes} onChange={(v) => set("notes", v)} />
        <ErrorBox error={save.error} />
      </div>
    </Modal>
  );
}
