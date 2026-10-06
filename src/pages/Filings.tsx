import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Comments } from "../components/Comments";
import { DocumentTable, DocumentUploadModal } from "../components/Documents";
import { AreaTag, DueText, Empty, ErrorBox, FilingBadge, Icon, Loading, Modal, RequestBadge, Tabs } from "../components/ui";
import {
  deleteFiling, insertFilingsSkippingExisting, keys, saveFiling, useDocuments, useFilings, useLookups, useRequests,
  useWrite, type FilingInput,
} from "../lib/api";
import {
  COMPLIANCE_GROUP_AREA_HINT, COMPLIANCE_GROUP_LABEL, COMPLIANCE_PRESETS, generateCompliance, type ComplianceGroup,
} from "../lib/compliance";
import { filingDueState, formatDate, fyLabel, fyStartYear, todayISO } from "../lib/dates";
import { FILING_STATUS_LABEL, type Filing, type FilingStatus } from "../lib/types";
import { RequestModal } from "./Requests";

type Tab = "upcoming" | "overdue" | "filed" | "all";

export function FilingsPage() {
  const { canEditAny, isAdmin } = useAuth();
  const filings = useFilings();
  const { areas, areaById, personName } = useLookups();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab) || "upcoming";
  const [area, setArea] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);

  const today = todayISO();
  const groups = useMemo(() => {
    const all = (filings.data ?? []).filter(
      (f) =>
        (!area || f.area_id === area) &&
        (!q || `${f.title} ${f.form_code ?? ""} ${f.period}`.toLowerCase().includes(q.toLowerCase())),
    );
    const state = (f: Filing) => filingDueState(f, today);
    return {
      upcoming: all.filter((f) => state(f) === "upcoming" || state(f) === "due_soon"),
      overdue: all.filter((f) => state(f) === "overdue"),
      filed: all
        .filter((f) => f.status === "filed" || f.status === "not_applicable")
        .sort((a, b) => b.due_date.localeCompare(a.due_date)),
      all,
    };
  }, [filings.data, area, q, today]);

  const rows = groups[tab];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Filings</h1>
          <p>Statutory filings and compliance deadlines — what's coming up, what's late and what's done.</p>
        </div>
        <div className="actions">
          {isAdmin && (
            <button className="btn" onClick={() => setGenerating(true)}>
              <Icon name="calendar" size={16} /> Generate compliance calendar
            </button>
          )}
          {canEditAny && (
            <button className="btn btn-primary" onClick={() => setCreating(true)}>
              <Icon name="plus" size={16} /> Add filing
            </button>
          )}
        </div>
      </div>

      <div className="toolbar">
        <Tabs
          value={tab}
          onChange={(v) => setParams({ tab: v })}
          items={[
            { value: "upcoming", label: "Upcoming", count: groups.upcoming.length },
            { value: "overdue", label: "Overdue", count: groups.overdue.length },
            { value: "filed", label: "Done", count: groups.filed.length },
            { value: "all", label: "All", count: groups.all.length },
          ]}
        />
        <select className="select" value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">All areas</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <input className="input search" placeholder="Search form, period…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="card">
        {filings.isLoading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <Empty title={tab === "overdue" ? "Nothing overdue 🎉" : "No filings here"}>
            {(filings.data ?? []).length === 0 && isAdmin ? "Use “Generate compliance calendar” to add a full year of GST, TDS, ROC and payroll deadlines." : null}
          </Empty>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Due date</th>
                  <th>Filing</th>
                  <th>Period</th>
                  <th>Area</th>
                  <th>Status</th>
                  <th>{tab === "filed" ? "Filed on / Ack no." : "Assigned to"}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => (
                  <tr key={f.id} className="clickable" onClick={() => setOpen(f.id)}>
                    <td className="nowrap num">
                      {formatDate(f.due_date)}
                      <DueText filing={f} />
                    </td>
                    <td>
                      <div className="cell-title">{f.title}</div>
                      {f.form_code && f.form_code !== f.title && <div className="cell-sub">{f.form_code}</div>}
                    </td>
                    <td className="nowrap">{f.period || "—"}</td>
                    <td><AreaTag area={areaById.get(f.area_id)} /></td>
                    <td><FilingBadge filing={f} /></td>
                    <td>
                      {tab === "filed" ? (
                        <>
                          {formatDate(f.filed_on)}
                          {f.ack_number && <div className="cell-sub">{f.ack_number}</div>}
                        </>
                      ) : (
                        personName(f.assignee_id)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && <FilingModal filingId={open} onClose={() => setOpen(null)} />}
      {creating && <FilingModal filingId={null} onClose={() => setCreating(false)} />}
      {generating && <GenerateModal onClose={() => setGenerating(false)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function FilingModal({ filingId, onClose }: { filingId: string | null; onClose: () => void }) {
  const { canEdit, isAdmin } = useAuth();
  const filings = useFilings();
  const filing = filingId ? filings.data?.find((f) => f.id === filingId) : undefined;
  const [editing, setEditing] = useState(filingId === null);

  if (filingId && !filing) {
    return <Modal title="Filing" onClose={onClose}>{filings.isLoading ? <Loading /> : <p>This filing no longer exists.</p>}</Modal>;
  }
  if (editing) {
    return <FilingForm filing={filing} onClose={filing ? () => setEditing(false) : onClose} onSaved={filing ? () => setEditing(false) : onClose} />;
  }
  return <FilingDetails filing={filing!} onClose={onClose} onEdit={() => setEditing(true)} editable={canEdit(filing!.area_id)} deletable={isAdmin} />;
}

function FilingDetails({
  filing, onClose, onEdit, editable, deletable,
}: { filing: Filing; onClose: () => void; onEdit: () => void; editable: boolean; deletable: boolean }) {
  const { areaById, personName } = useLookups();
  const requests = useRequests();
  const documents = useDocuments();
  const [markFiled, setMarkFiled] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [openRequest, setOpenRequest] = useState<string | null>(null);
  const [filedOn, setFiledOn] = useState(todayISO());
  const [ack, setAck] = useState("");
  const save = useWrite((input: FilingInput) => saveFiling(filing.id, input), [keys.filings]);
  const remove = useWrite(() => deleteFiling(filing.id), [keys.filings]);

  const linkedRequests = (requests.data ?? []).filter((r) => r.filing_id === filing.id);
  const linkedDocs = (documents.data ?? []).filter((d) => d.filing_id === filing.id);
  const setStatus = (status: FilingStatus) => save.mutate({ status, ...(status !== "filed" ? { filed_on: null } : {}) });

  return (
    <>
      <Modal
        wide
        title={<>{filing.title}{filing.period && <span className="muted"> · {filing.period}</span>}</>}
        onClose={onClose}
        footer={
          <>
            {deletable && (
              <button
                className="btn btn-ghost btn-danger"
                disabled={remove.isPending}
                onClick={() => confirm("Delete this filing?") && remove.mutate(undefined, { onSuccess: onClose })}
              >
                Delete
              </button>
            )}
            <span className="spacer" />
            {editable && <button className="btn" onClick={onEdit}>Edit</button>}
            {editable && filing.status !== "filed" && (
              <button className="btn btn-primary" onClick={() => setMarkFiled(true)}>Mark as filed</button>
            )}
          </>
        }
      >
        <dl className="meta">
          <dt>Status</dt>
          <dd><FilingBadge filing={filing} /> <DueText filing={filing} /></dd>
          <dt>Due date</dt>
          <dd>{formatDate(filing.due_date)}</dd>
          <dt>Form</dt>
          <dd>{filing.form_code || "—"}</dd>
          <dt>Area</dt>
          <dd><AreaTag area={areaById.get(filing.area_id)} /></dd>
          <dt>Assigned to</dt>
          <dd>{personName(filing.assignee_id)}</dd>
          {filing.status === "filed" && (
            <>
              <dt>Filed on</dt>
              <dd>{formatDate(filing.filed_on)}</dd>
              <dt>Acknowledgement</dt>
              <dd>{filing.ack_number || "—"}</dd>
            </>
          )}
          {filing.notes && (
            <>
              <dt>Notes</dt>
              <dd className="pre">{filing.notes}</dd>
            </>
          )}
        </dl>

        {editable && filing.status !== "filed" && (
          <div className="actions" style={{ marginTop: 14 }}>
            <span className="small muted">Set status:</span>
            {(["pending", "in_progress", "not_applicable"] as FilingStatus[]).map((s) => (
              <button key={s} className="btn btn-sm" disabled={filing.status === s || save.isPending} onClick={() => setStatus(s)}>
                {FILING_STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        )}
        {editable && filing.status === "filed" && (
          <div style={{ marginTop: 14 }}>
            <button className="btn btn-sm" onClick={() => setStatus("pending")}>Re-open (mark not filed)</button>
          </div>
        )}

        {markFiled && (
          <div className="card card-pad" style={{ marginTop: 16 }}>
            <div className="form">
              <h3>Mark as filed</h3>
              <div className="form-row">
                <label className="field">
                  <span>Filed on</span>
                  <input className="input" type="date" value={filedOn} onChange={(e) => setFiledOn(e.target.value)} />
                </label>
                <label className="field">
                  <span>Acknowledgement / ARN / SRN</span>
                  <input className="input" value={ack} onChange={(e) => setAck(e.target.value)} />
                </label>
              </div>
              <div className="actions">
                <button
                  className="btn btn-primary btn-sm"
                  disabled={!filedOn || save.isPending}
                  onClick={() =>
                    save.mutate(
                      { status: "filed", filed_on: filedOn, ack_number: ack.trim() || null },
                      { onSuccess: () => setMarkFiled(false) },
                    )
                  }
                >
                  Save
                </button>
                <button className="btn btn-sm" onClick={() => setMarkFiled(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        <ErrorBox error={save.error ?? remove.error} />

        <div className="section-title">Documents ({linkedDocs.length})</div>
        <DocumentTable docs={linkedDocs} showArea={false} />
        {editable && (
          <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => setUploading(true)}>
            <Icon name="plus" size={15} /> Attach document (e.g. acknowledgement, challan)
          </button>
        )}

        {linkedRequests.length > 0 && (
          <>
            <div className="section-title">Document requests ({linkedRequests.length})</div>
            <ul className="list card">
              {linkedRequests.map((r) => (
                <li key={r.id} className="list-item clickable" onClick={() => setOpenRequest(r.id)}>
                  <div className="grow">{r.title}</div>
                  <RequestBadge status={r.status} />
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="section-title">Discussion</div>
        <Comments kind="filing" parentId={filing.id} />
      </Modal>
      {uploading && (
        <DocumentUploadModal
          lockArea
          defaults={{ area_id: filing.area_id, filing_id: filing.id, category: "Acknowledgement", title: `${filing.title} ${filing.period}`.trim() }}
          onClose={() => setUploading(false)}
        />
      )}
      {openRequest && <RequestModal requestId={openRequest} onClose={() => setOpenRequest(null)} />}
    </>
  );
}

function FilingForm({ filing, onClose, onSaved }: { filing?: Filing; onClose: () => void; onSaved: () => void }) {
  const { canEdit } = useAuth();
  const { areas, personById } = useLookups();
  const editable = areas.filter((a) => canEdit(a.id) || a.id === filing?.area_id);
  const [form, setForm] = useState<FilingInput>({
    area_id: filing?.area_id ?? editable[0]?.id ?? "",
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
  const people = [...personById.values()].filter((p) => p.is_active);
  const valid = form.area_id && form.title?.trim() && form.due_date;

  return (
    <Modal
      title={filing ? "Edit filing" : "Add filing"}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!valid || save.isPending}
            onClick={() =>
              save.mutate(
                {
                  ...form,
                  title: form.title!.trim(),
                  form_code: form.form_code?.trim() || null,
                  period: form.period?.trim() ?? "",
                  notes: form.notes?.trim() || null,
                },
                { onSuccess: onSaved },
              )
            }
          >
            {save.isPending ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
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
            <span>Area</span>
            <select className="select" value={form.area_id} onChange={(e) => set("area_id", e.target.value)}>
              {editable.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Assigned to</span>
            <select className="select" value={form.assignee_id ?? ""} onChange={(e) => set("assignee_id", e.target.value || null)}>
              <option value="">—</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email}{p.organization ? ` (${p.organization})` : ""}</option>)}
            </select>
          </label>
        </div>
        {!filing && (
          <label className="field">
            <span>Status</span>
            <select className="select" value={form.status} onChange={(e) => set("status", e.target.value as FilingStatus)}>
              {(Object.keys(FILING_STATUS_LABEL) as FilingStatus[]).filter((s) => s !== "filed").map((s) => (
                <option key={s} value={s}>{FILING_STATUS_LABEL[s]}</option>
              ))}
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

// ---------------------------------------------------------------------------

function GenerateModal({ onClose }: { onClose: () => void }) {
  const { areas } = useLookups();
  const currentFy = fyStartYear(todayISO());
  const [fy, setFy] = useState(currentFy);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(["gstr1", "gstr3b", "tds_payment", "tds_return", "advance_tax", "itr", "aoc4", "mgt7", "dir3kyc"]),
  );
  const guess = (g: ComplianceGroup) => areas.find((a) => COMPLIANCE_GROUP_AREA_HINT[g].test(a.name))?.id ?? areas[0]?.id ?? "";
  const [groupArea, setGroupArea] = useState<Record<ComplianceGroup, string>>({
    tax: guess("tax"), roc: guess("roc"), payroll: guess("payroll"),
  });
  const [result, setResult] = useState<string | null>(null);

  const preview = generateCompliance(fy, [...selected]);
  const run = useWrite(
    () =>
      insertFilingsSkippingExisting(
        preview.map((p) => ({
          area_id: groupArea[p.group], title: p.title, form_code: p.form_code, period: p.period, due_date: p.due_date,
        })),
      ),
    [keys.filings],
  );

  const toggle = (k: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k); else n.add(k);
      return n;
    });

  const groups = Object.keys(COMPLIANCE_GROUP_LABEL) as ComplianceGroup[];

  return (
    <Modal
      wide
      title="Generate compliance calendar"
      onClose={onClose}
      footer={
        result ? (
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        ) : (
          <>
            <button className="btn" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-primary"
              disabled={preview.length === 0 || run.isPending || groups.some((g) => preview.some((p) => p.group === g) && !groupArea[g])}
              onClick={() =>
                run.mutate(undefined, {
                  onSuccess: (n) => setResult(`${n} filing${n === 1 ? "" : "s"} added. ${preview.length - Number(n)} already existed and were skipped.`),
                })
              }
            >
              {run.isPending ? "Adding…" : `Add ${preview.length} filings`}
            </button>
          </>
        )
      }
    >
      {result ? (
        <div className="alert alert-ok">{result}</div>
      ) : (
        <div className="form">
          <p className="muted" style={{ margin: 0 }}>
            Creates one entry per period with the regular statutory due date. Running it again is safe — existing entries are skipped.
            When the government extends a deadline, just edit that filing's due date.
          </p>
          <label className="field" style={{ maxWidth: 240 }}>
            <span>Financial year</span>
            <select className="select" value={fy} onChange={(e) => setFy(Number(e.target.value))}>
              {[currentFy - 1, currentFy, currentFy + 1].map((y) => <option key={y} value={y}>{fyLabel(y)}</option>)}
            </select>
          </label>
          {groups.map((g) => (
            <div key={g} className="card card-pad">
              <div className="actions" style={{ justifyContent: "space-between", marginBottom: 10 }}>
                <h3>{COMPLIANCE_GROUP_LABEL[g]}</h3>
                <label className="actions small">
                  <span className="muted">Put in area</span>
                  <select
                    className="select"
                    style={{ width: "auto" }}
                    value={groupArea[g]}
                    onChange={(e) => setGroupArea((s) => ({ ...s, [g]: e.target.value }))}
                  >
                    {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid grid-2" style={{ gap: 8 }}>
                {COMPLIANCE_PRESETS.filter((p) => p.group === g).map((p) => (
                  <label key={p.key} className="check">
                    <input type="checkbox" checked={selected.has(p.key)} onChange={() => toggle(p.key)} />
                    <span>
                      <strong>{p.formCode}</strong> {p.title !== p.formCode && <span className="muted">· {p.title}</span>}
                      <div className="faint small">{p.frequency} · {p.note}</div>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <ErrorBox error={run.error} />
        </div>
      )}
    </Modal>
  );
}
