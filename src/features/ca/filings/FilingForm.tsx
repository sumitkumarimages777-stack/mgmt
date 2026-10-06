import { useState } from "react";
import { keys, saveFiling, useLookups, useWrite, type FilingInput } from "../../../api";
import { ErrorBox, Modal } from "../../../components/ui";
import { todayISO } from "../../../lib/dates";
import { FILING_CATEGORIES, FILING_STATUS_LABEL } from "../../../lib/labels";
import type { Filing, FilingStatus } from "../../../lib/types";

interface Props {
  filing?: Filing;
  onClose: () => void;
  onSaved: () => void;
}

const NEW_STATUSES = (Object.keys(FILING_STATUS_LABEL) as FilingStatus[]).filter((s) => s !== "filed");

export function FilingForm({ filing, onClose, onSaved }: Props) {
  const { personById } = useLookups();
  const people = [...personById.values()].filter((p) => p.is_active);
  const [form, setForm] = useState<FilingInput>({
    category: filing?.category ?? FILING_CATEGORIES[0],
    title: filing?.title ?? "",
    form_code: filing?.form_code ?? "",
    period: filing?.period ?? "",
    due_date: filing?.due_date ?? todayISO(),
    status: filing?.status ?? "pending",
    assignee_id: filing?.assignee_id ?? null,
    notes: filing?.notes ?? "",
  });
  const set = <K extends keyof FilingInput>(k: K, v: FilingInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const save = useWrite((input: FilingInput) => saveFiling(filing?.id ?? null, input), [keys.filings]);
  const valid = !!form.category && !!form.title?.trim() && !!form.due_date;

  const submit = () =>
    save.mutate(
      {
        ...form,
        title: form.title!.trim(),
        form_code: form.form_code?.trim() || null,
        period: form.period?.trim() ?? "",
        notes: form.notes?.trim() || null,
      },
      { onSuccess: onSaved },
    );

  const footer = (
    <>
      <button className="btn" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" disabled={!valid || save.isPending} onClick={submit}>
        {save.isPending ? "Saving…" : "Save"}
      </button>
    </>
  );

  return (
    <Modal title={filing ? "Edit filing" : "Add filing"} onClose={onClose} footer={footer}>
      <div className="form">
        <div className="form-row">
          <label className="field">
            <span>Filing name</span>
            <input className="input" value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="e.g. GSTR-3B" />
          </label>
          <label className="field">
            <span>Form code</span>
            <input className="input" value={form.form_code ?? ""} onChange={(e) => set("form_code", e.target.value)} placeholder="optional" />
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span>Period</span>
            <input className="input" value={form.period ?? ""} onChange={(e) => set("period", e.target.value)} placeholder="e.g. Sep 2026 / Q2 FY 2026-27" />
          </label>
          <label className="field">
            <span>Due date</span>
            <input className="input" type="date" value={form.due_date ?? ""} onChange={(e) => set("due_date", e.target.value)} />
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span>Category</span>
            <select className="select" value={form.category} onChange={(e) => set("category", e.target.value)}>
              {FILING_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Assigned to</span>
            <select className="select" value={form.assignee_id ?? ""} onChange={(e) => set("assignee_id", e.target.value || null)}>
              <option value="">—</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name || p.email}{p.organization ? ` (${p.organization})` : ""}</option>
              ))}
            </select>
          </label>
        </div>
        {!filing && (
          <label className="field">
            <span>Status</span>
            <select className="select" value={form.status} onChange={(e) => set("status", e.target.value as FilingStatus)}>
              {NEW_STATUSES.map((s) => <option key={s} value={s}>{FILING_STATUS_LABEL[s]}</option>)}
            </select>
          </label>
        )}
        <label className="field">
          <span>Notes</span>
          <textarea className="textarea" value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
        </label>
        <ErrorBox error={save.error} />
      </div>
    </Modal>
  );
}
