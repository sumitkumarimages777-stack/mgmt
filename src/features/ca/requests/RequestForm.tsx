import { useState } from "react";
import { keys, saveRequest, useFilings, useWrite, type RequestInput } from "../../../api";
import { ErrorBox, Modal } from "../../../components/ui";
import { formatDate } from "../../../lib/dates";
import type { DocumentRequest } from "../../../lib/types";
import { useAuth } from "../../auth/AuthContext";

export function RequestForm({ request, onClose }: { request?: DocumentRequest; onClose: () => void }) {
  const { can } = useAuth();
  const filings = useFilings(can("ca.filings"));
  const [form, setForm] = useState<RequestInput>({
    module: request?.module ?? "ca",
    title: request?.title ?? "",
    description: request?.description ?? "",
    due_date: request?.due_date ?? null,
    filing_id: request?.filing_id ?? null,
  });
  const set = <K extends keyof RequestInput>(k: K, v: RequestInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const save = useWrite((input: RequestInput) => saveRequest(request?.id ?? null, input), [keys.requests]);
  const openFilings = (filings.data ?? []).filter((f) => f.status !== "filed" || f.id === form.filing_id);
  const valid = !!form.title?.trim();

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
            <span>Needed by</span>
            <input className="input" type="date" value={form.due_date ?? ""} onChange={(e) => set("due_date", e.target.value || null)} />
          </label>
        </div>
        <label className="field">
          <span>For filing (optional)</span>
          <select className="select" value={form.filing_id ?? ""} onChange={(e) => set("filing_id", e.target.value || null)}>
            <option value="">—</option>
            {openFilings.map((f) => (
              <option key={f.id} value={f.id}>{f.title}{f.period ? ` · ${f.period}` : ""} (due {formatDate(f.due_date)})</option>
            ))}
          </select>
        </label>
        <ErrorBox error={save.error} />
      </div>
    </Modal>
  );
}
