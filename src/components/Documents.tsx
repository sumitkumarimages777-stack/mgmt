import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import {
  deleteDocument, errorMessage, formatBytes, keys, openDocument, uploadDocument, useLookups, useWrite,
  type DocumentUpload,
} from "../lib/api";
import { formatDate } from "../lib/dates";
import { DOCUMENT_CATEGORIES, type SharedDocument } from "../lib/types";
import { AreaTag, ErrorBox, Icon, Modal } from "./ui";

/** Upload a file or share a link. Area / request / filing can be pre-filled. */
export function DocumentUploadModal({
  onClose, defaults, lockArea,
}: { onClose: () => void; defaults?: Partial<DocumentUpload>; lockArea?: boolean }) {
  const { profile, canEdit } = useAuth();
  const { areas } = useLookups();
  const editable = areas.filter((a) => canEdit(a.id));
  const [mode, setMode] = useState<"file" | "link">("file");
  const [form, setForm] = useState<DocumentUpload>({
    area_id: defaults?.area_id ?? editable[0]?.id ?? "",
    title: defaults?.title ?? "",
    category: defaults?.category ?? "",
    description: "",
    request_id: defaults?.request_id ?? null,
    filing_id: defaults?.filing_id ?? null,
    file: null,
    external_url: "",
  });
  const save = useWrite(
    (input: DocumentUpload) => uploadDocument(input, profile!.id),
    [keys.documents, keys.requests],
  );

  const set = <K extends keyof DocumentUpload>(k: K, v: DocumentUpload[K]) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.area_id && form.title.trim() && (mode === "file" ? !!form.file : !!form.external_url?.trim());

  const submit = () => {
    if (!valid) return;
    save.mutate(
      {
        ...form,
        title: form.title.trim(),
        file: mode === "file" ? form.file : null,
        external_url: mode === "link" ? form.external_url?.trim() : null,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      title="Share a document"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!valid || save.isPending} onClick={submit}>
            {save.isPending ? "Uploading…" : "Share"}
          </button>
        </>
      }
    >
      <div className="form">
        <div className="seg" role="radiogroup">
          <button className={mode === "file" ? "on" : ""} onClick={() => setMode("file")}>Upload file</button>
          <button className={mode === "link" ? "on" : ""} onClick={() => setMode("link")}>Share a link</button>
        </div>
        {mode === "file" ? (
          <label className="field">
            <span>File</span>
            <input
              className="input"
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setForm((f) => ({ ...f, file, title: f.title || (file ? file.name.replace(/\.[^.]+$/, "") : "") }));
              }}
            />
            <small>Max 50 MB. Stored privately — only people with access to the area can open it.</small>
          </label>
        ) : (
          <label className="field">
            <span>Link</span>
            <input
              className="input"
              type="url"
              placeholder="https://drive.google.com/…"
              value={form.external_url ?? ""}
              onChange={(e) => set("external_url", e.target.value)}
            />
          </label>
        )}
        <label className="field">
          <span>Title</span>
          <input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. HDFC bank statement Sep 2026" />
        </label>
        <div className="form-row">
          <label className="field">
            <span>Area</span>
            <select className="select" value={form.area_id} disabled={lockArea} onChange={(e) => set("area_id", e.target.value)}>
              {editable.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Category</span>
            <select className="select" value={form.category ?? ""} onChange={(e) => set("category", e.target.value)}>
              <option value="">—</option>
              {DOCUMENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        </div>
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

export function DocumentTable({ docs, showArea = true }: { docs: SharedDocument[]; showArea?: boolean }) {
  const { profile, isAdmin, canEdit } = useAuth();
  const { areaById, personName, personById } = useLookups();
  const [err, setErr] = useState<string | null>(null);
  const remove = useWrite((d: SharedDocument) => deleteDocument(d), [keys.documents]);

  if (docs.length === 0) return <p className="faint small" style={{ margin: 0 }}>No documents.</p>;
  return (
    <>
      {err && <div className="alert alert-error" style={{ marginBottom: 10 }}>{err}</div>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Document</th>
              {showArea && <th>Area</th>}
              <th>Shared by</th>
              <th>Date</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => {
              const uploader = d.uploaded_by ? personById.get(d.uploaded_by) : undefined;
              const canDelete = isAdmin || (d.uploaded_by === profile?.id && canEdit(d.area_id));
              return (
                <tr key={d.id}>
                  <td>
                    <div className="cell-title">{d.title}</div>
                    <div className="cell-sub">
                      {[d.category, d.file_name ?? (d.external_url ? "Link" : null), formatBytes(d.file_size)].filter(Boolean).join(" · ")}
                    </div>
                    {d.description && <div className="cell-sub pre">{d.description}</div>}
                  </td>
                  {showArea && <td><AreaTag area={areaById.get(d.area_id)} /></td>}
                  <td>
                    {personName(d.uploaded_by)}
                    {uploader?.organization && <div className="cell-sub">{uploader.organization}</div>}
                  </td>
                  <td className="nowrap">{formatDate(d.created_at)}</td>
                  <td className="nowrap" style={{ textAlign: "right" }}>
                    <button
                      className="btn btn-sm"
                      onClick={() => openDocument(d).catch((e) => setErr(errorMessage(e)))}
                      title={d.storage_path ? "Download" : "Open link"}
                    >
                      <Icon name={d.storage_path ? "download" : "link"} size={15} />
                      {d.storage_path ? "Download" : "Open"}
                    </button>
                    {canDelete && (
                      <button
                        className="btn btn-sm btn-ghost btn-danger"
                        disabled={remove.isPending}
                        onClick={() => {
                          if (confirm(`Delete "${d.title}"? This cannot be undone.`)) {
                            remove.mutate(d, { onError: (e) => setErr(errorMessage(e)) });
                          }
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
