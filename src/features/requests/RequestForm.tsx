import { useState } from "react";
import { keys, saveRequest, useFilings, useLookups, useWrite, type RequestInput } from "../../api";
import { ErrorBox, Modal } from "../../components/ui";
import { formatDate } from "../../lib/dates";
import type { DocumentRequest } from "../../lib/types";
import { useAuth } from "../auth/AuthContext";

export function RequestForm({ request, onClose }: { request?: DocumentRequest; onClose: () => void }) {
  const { canEdit } = useAuth();
  const { areas } = useLookups();
  const filings = useFilings();
  const editableAreas = areas.filter((a) => canEdit(a.id) || a.id === request?.area_id);
  const [form, setForm] = useState<RequestInput>({
    area_id: request?.area_id ?? editableAreas[0]?.id ?? "",
    title: request?.title ?? "",
    description: request?.description ?? "",
    due_date: request?.due_date ?? null,
    filing_id: request?.filing_id ?? null,
  });
  const set = <K extends keyof RequestInput>(k: K, v: RequestInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const save = useWrite((input: RequestInput) => saveRequest(request?.id ?? null, input), [keys.requests]);
  const areaFilings = (filings.data ?? []).filter(
    (f) => f.area_id === form.area_id && (f.status !== "filed" || f.id === form.filing_id),
  );
  const valid = !!form.area_id && !!form.title?.trim();

  const submit = () =>
    save.mutate(
      { ...form, title: form.title!.trim(), description: form.description?.trim() || null, due_date: form.due_date || null },
      { onSuccess: onClose },
    );

  const footer = (
    <>
      <button className="btn" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" disabled={!valid || save.isPending} onClick={submit}>
        {save.isPending ? "Saving…" : request ? "Save" : "Send request"}
      </button>
    </>
  );

  return (
    <Modal title={request ? "Edit request" : "Request a document"} onClose={onClose} footer={footer}>
      <div className="form">
        <label className="field">
          <span>What document is needed?</span>
          <input className="input" value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Bank statements Apr–Sep 2026 (all accounts)" />
        </label>
        <label className="field">
          <span>Details</span>
          <textarea className="textarea" value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="Format, accounts, any specifics…" />
        </label>
        <div className="form-row">
          <label className="field">
            <span>Area</span>
            <select className="select" value={form.area_id} onChange={(e) => setForm((f) => ({ ...f, area_id: e.target.value, filing_id: null }))}>
              {editableAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Needed by</span>
            <input className="input" type="date" value={form.due_date ?? ""} onChange={(e) => set("due_date", e.target.value || null)} />
          </label>
        </div>
        <label className="field">
          <span>For filing (optional)</span>
          <select className="select" value={form.filing_id ?? ""} onChange={(e) => set("filing_id", e.target.value || null)}>
            <option value="">—</option>
            {areaFilings.map((f) => (
              <option key={f.id} value={f.id}>{f.title}{f.period ? ` · ${f.period}` : ""} (due {formatDate(f.due_date)})</option>
            ))}
          </select>
        </label>
        <ErrorBox error={save.error} />
      </div>
    </Modal>
  );
}
