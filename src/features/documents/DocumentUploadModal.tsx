import { useState } from "react";
import { keys, uploadDocument, useWrite, type DocumentUpload } from "../../api";
import { ErrorBox, Modal } from "../../components/ui";
import { DOCUMENT_CATEGORIES } from "../../lib/labels";
import { useAuth } from "../auth/AuthContext";
import { FileOrLinkInput, type SourceMode } from "./FileOrLinkInput";

interface Props {
  onClose: () => void;
  /** Where the document belongs (module + feature) and what it is attached to. */
  defaults: Pick<DocumentUpload, "module" | "feature"> & Partial<DocumentUpload>;
}

/** Upload a file or share a link into one module/feature (e.g. CA → Records). */
export function DocumentUploadModal({ onClose, defaults }: Props) {
  const { profile } = useAuth();
  const [mode, setMode] = useState<SourceMode>("file");
  const [form, setForm] = useState<DocumentUpload>({
    module: defaults.module,
    feature: defaults.feature,
    title: defaults.title ?? "",
    category: defaults.category ?? "",
    description: "",
    request_id: defaults.request_id ?? null,
    filing_id: defaults.filing_id ?? null,
    file: null,
    external_url: "",
  });
  const save = useWrite((input: DocumentUpload) => uploadDocument(input, profile!.id), [keys.documents, keys.requests]);

  const set = <K extends keyof DocumentUpload>(k: K, v: DocumentUpload[K]) => setForm((f) => ({ ...f, [k]: v }));
  const hasSource = mode === "file" ? !!form.file : !!form.external_url?.trim();
  const valid = !!form.title.trim() && hasSource;

  const submit = () =>
    save.mutate(
      {
        ...form,
        title: form.title.trim(),
        file: mode === "file" ? form.file : null,
        external_url: mode === "link" ? form.external_url?.trim() : null,
      },
      { onSuccess: onClose },
    );

  const footer = (
    <>
      <button className="btn" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" disabled={!valid || save.isPending} onClick={submit}>
        {save.isPending ? "Uploading…" : "Share"}
      </button>
    </>
  );

  return (
    <Modal title="Share a document" onClose={onClose} footer={footer}>
      <div className="form">
        <FileOrLinkInput
          mode={mode}
          onModeChange={setMode}
          url={form.external_url ?? ""}
          onUrlChange={(v) => set("external_url", v)}
          onFile={(file) =>
            setForm((f) => ({ ...f, file, title: f.title || (file ? file.name.replace(/\.[^.]+$/, "") : "") }))
          }
        />
        <label className="field">
          <span>Title</span>
          <input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. HDFC bank statement Sep 2026" />
        </label>
        <label className="field">
          <span>Category</span>
          <select className="select" value={form.category ?? ""} onChange={(e) => set("category", e.target.value)}>
            <option value="">—</option>
            {DOCUMENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Note (optional)</span>
          <textarea className="textarea" value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
        </label>
        {form.request_id && <div className="alert alert-info">This will be attached to the document request and mark it as submitted.</div>}
        <ErrorBox error={save.error} />
      </div>
    </Modal>
  );
}
