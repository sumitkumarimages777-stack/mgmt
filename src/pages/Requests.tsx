import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { Comments } from "../components/Comments";
import { DocumentTable, DocumentUploadModal } from "../components/Documents";
import { AreaTag, Empty, ErrorBox, Icon, Loading, Modal, RequestBadge, Tabs } from "../components/ui";
import {
  addComment, deleteRequest, keys, saveRequest, useDocuments, useFilings, useLookups, useRequests, useWrite,
  type RequestInput,
} from "../lib/api";
import { daysBetween, formatDate, todayISO } from "../lib/dates";
import type { DocumentRequest, RequestStatus } from "../lib/types";

type Tab = "pending" | "review" | "closed" | "all";

export function RequestsPage() {
  const { canEditAny } = useAuth();
  const requests = useRequests();
  const documents = useDocuments();
  const { areas, areaById, personName, personById } = useLookups();
  const [tab, setTab] = useState<Tab>("pending");
  const [area, setArea] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const groups = useMemo(() => {
    const all = (requests.data ?? []).filter(
      (r) => (!area || r.area_id === area) && (!q || `${r.title} ${r.description ?? ""}`.toLowerCase().includes(q.toLowerCase())),
    );
    return {
      pending: all.filter((r) => r.status === "open" || r.status === "rejected"),
      review: all.filter((r) => r.status === "submitted"),
      closed: all.filter((r) => r.status === "accepted" || r.status === "cancelled"),
      all,
    };
  }, [requests.data, area, q]);
  const docCount = (id: string) => (documents.data ?? []).filter((d) => d.request_id === id).length;
  const today = todayISO();

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Document requests</h1>
          <p>What your CA, lawyer or team has asked for, and whether it has been sent.</p>
        </div>
        {canEditAny && (
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            <Icon name="plus" size={16} /> Request a document
          </button>
        )}
      </div>

      <div className="toolbar">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "pending", label: "To send", count: groups.pending.length },
            { value: "review", label: "Sent — to review", count: groups.review.length },
            { value: "closed", label: "Closed", count: groups.closed.length },
            { value: "all", label: "All", count: groups.all.length },
          ]}
        />
        <select className="select" value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">All areas</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <input className="input search" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="card">
        {requests.isLoading ? (
          <Loading />
        ) : groups[tab].length === 0 ? (
          <Empty title={tab === "pending" ? "Nothing waiting to be sent" : "No requests here"} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Area</th>
                  <th>Requested by</th>
                  <th>Needed by</th>
                  <th>Status</th>
                  <th>Files</th>
                </tr>
              </thead>
              <tbody>
                {groups[tab].map((r) => {
                  const late = r.due_date && (r.status === "open" || r.status === "rejected") && daysBetween(today, r.due_date) < 0;
                  const requester = r.requested_by ? personById.get(r.requested_by) : undefined;
                  return (
                    <tr key={r.id} className="clickable" onClick={() => setOpen(r.id)}>
                      <td>
                        <div className="cell-title">{r.title}</div>
                        {r.description && <div className="cell-sub" style={{ maxWidth: 420, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</div>}
                      </td>
                      <td><AreaTag area={areaById.get(r.area_id)} /></td>
                      <td>
                        {personName(r.requested_by)}
                        <div className="cell-sub">{requester?.organization ?? ""} {formatDate(r.created_at)}</div>
                      </td>
                      <td className="nowrap" style={late ? { color: "var(--red)" } : undefined}>{formatDate(r.due_date)}</td>
                      <td><RequestBadge status={r.status} /></td>
                      <td className="num">{docCount(r.id) || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && <RequestModal requestId={open} onClose={() => setOpen(null)} />}
      {creating && <RequestForm onClose={() => setCreating(false)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function RequestModal({ requestId, onClose }: { requestId: string; onClose: () => void }) {
  const { profile, isAdmin, canEdit } = useAuth();
  const requests = useRequests();
  const documents = useDocuments();
  const filings = useFilings();
  const { areaById, personName } = useLookups();
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const r = requests.data?.find((x) => x.id === requestId);
  const setStatus = useWrite(
    async ({ status, note }: { status: RequestStatus; note?: string }) => {
      if (note) await addComment("request", requestId, note);
      return saveRequest(requestId, { status });
    },
    [keys.requests, keys.comments("request", requestId)],
  );
  const remove = useWrite(() => deleteRequest(requestId), [keys.requests]);

  if (!r) return <Modal title="Request" onClose={onClose}>{requests.isLoading ? <Loading /> : <p>This request no longer exists.</p>}</Modal>;
  if (editing) return <RequestForm request={r} onClose={() => setEditing(false)} />;

  const editable = canEdit(r.area_id);
  const isRequester = r.requested_by === profile?.id;
  const docs = (documents.data ?? []).filter((d) => d.request_id === r.id);
  const filing = r.filing_id ? filings.data?.find((f) => f.id === r.filing_id) : undefined;
  const isOpen = r.status === "open" || r.status === "rejected";

  return (
    <>
      <Modal
        wide
        title={r.title}
        onClose={onClose}
        footer={
          <>
            {(isAdmin || (isRequester && editable)) && (
              <button
                className="btn btn-ghost btn-danger"
                onClick={() => confirm("Delete this request?") && remove.mutate(undefined, { onSuccess: onClose })}
              >
                Delete
              </button>
            )}
            <span className="spacer" />
            {editable && (isRequester || isAdmin) && r.status !== "cancelled" && r.status !== "accepted" && (
              <button className="btn" onClick={() => setStatus.mutate({ status: "cancelled" })}>Cancel request</button>
            )}
            {editable && <button className="btn" onClick={() => setEditing(true)}>Edit</button>}
            {editable && r.status === "submitted" && (
              <>
                <button className="btn" onClick={() => setRejecting(true)}>Ask to re-upload</button>
                <button className="btn btn-primary" onClick={() => setStatus.mutate({ status: "accepted" })}>Accept</button>
              </>
            )}
            {editable && isOpen && (
              <button className="btn btn-primary" onClick={() => setUploading(true)}>
                <Icon name="plus" size={16} /> Upload document
              </button>
            )}
            {editable && (r.status === "accepted" || r.status === "cancelled") && (
              <button className="btn" onClick={() => setStatus.mutate({ status: "open" })}>Re-open</button>
            )}
          </>
        }
      >
        <dl className="meta">
          <dt>Status</dt>
          <dd><RequestBadge status={r.status} /></dd>
          <dt>Area</dt>
          <dd><AreaTag area={areaById.get(r.area_id)} /></dd>
          <dt>Requested by</dt>
          <dd>{personName(r.requested_by)} on {formatDate(r.created_at)}</dd>
          <dt>Needed by</dt>
          <dd>{formatDate(r.due_date)}</dd>
          {filing && (
            <>
              <dt>For filing</dt>
              <dd>{filing.title}{filing.period ? ` · ${filing.period}` : ""}</dd>
            </>
          )}
          {r.resolved_at && (
            <>
              <dt>Closed on</dt>
              <dd>{formatDate(r.resolved_at)}</dd>
            </>
          )}
        </dl>
        {r.description && <p className="pre" style={{ marginTop: 14 }}>{r.description}</p>}

        {rejecting && (
          <div className="card card-pad form" style={{ marginTop: 14 }}>
            <label className="field">
              <span>What's wrong / what is needed instead?</span>
              <textarea className="textarea" value={reason} onChange={(e) => setReason(e.target.value)} />
            </label>
            <div className="actions">
              <button
                className="btn btn-primary btn-sm"
                disabled={!reason.trim() || setStatus.isPending}
                onClick={() =>
                  setStatus.mutate(
                    { status: "rejected", note: `Re-upload needed: ${reason.trim()}` },
                    { onSuccess: () => { setRejecting(false); setReason(""); } },
                  )
                }
              >
                Send back
              </button>
              <button className="btn btn-sm" onClick={() => setRejecting(false)}>Cancel</button>
            </div>
          </div>
        )}
        <ErrorBox error={setStatus.error ?? remove.error} />

        <div className="section-title">Documents sent ({docs.length})</div>
        <DocumentTable docs={docs} showArea={false} />

        <div className="section-title">Discussion</div>
        <Comments kind="request" parentId={r.id} />
      </Modal>
      {uploading && (
        <DocumentUploadModal lockArea defaults={{ area_id: r.area_id, request_id: r.id, filing_id: r.filing_id, title: r.title }} onClose={() => setUploading(false)} />
      )}
    </>
  );
}

function RequestForm({ request, onClose }: { request?: DocumentRequest; onClose: () => void }) {
  const { canEdit } = useAuth();
  const { areas } = useLookups();
  const filings = useFilings();
  const editable = areas.filter((a) => canEdit(a.id) || a.id === request?.area_id);
  const [form, setForm] = useState<RequestInput>({
    area_id: request?.area_id ?? editable[0]?.id ?? "",
    title: request?.title ?? "",
    description: request?.description ?? "",
    due_date: request?.due_date ?? null,
    filing_id: request?.filing_id ?? null,
  });
  const set = <K extends keyof RequestInput>(k: K, v: RequestInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const save = useWrite((input: RequestInput) => saveRequest(request?.id ?? null, input), [keys.requests]);
  const areaFilings = (filings.data ?? []).filter((f) => f.area_id === form.area_id && (f.status !== "filed" || f.id === form.filing_id));
  const valid = form.area_id && form.title?.trim();

  return (
    <Modal
      title={request ? "Edit request" : "Request a document"}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!valid || save.isPending}
            onClick={() =>
              save.mutate(
                { ...form, title: form.title!.trim(), description: form.description?.trim() || null, due_date: form.due_date || null },
                { onSuccess: onClose },
              )
            }
          >
            {save.isPending ? "Saving…" : request ? "Save" : "Send request"}
          </button>
        </>
      }
    >
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
              {editable.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
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
