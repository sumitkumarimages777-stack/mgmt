import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { AreaTag, Empty, FilingBadge, Loading, RequestBadge } from "../components/ui";
import { useActivity, useDocuments, useFilings, useLookups, useRequests } from "../lib/api";
import { addDays, filingDueState, formatDate, formatDateTime, fyLabel, fyStartYear, relativeDue, todayISO } from "../lib/dates";
import { FilingModal } from "./Filings";
import { RequestModal } from "./Requests";

export function Dashboard() {
  const { profile, isAdmin, permissions } = useAuth();
  const filings = useFilings();
  const requests = useRequests();
  const documents = useDocuments();
  const activity = useActivity(12);
  const { areas, areaById, personName } = useLookups();
  const [openFiling, setOpenFiling] = useState<string | null>(null);
  const [openRequest, setOpenRequest] = useState<string | null>(null);

  if (filings.isLoading || requests.isLoading) return <div className="page"><Loading /></div>;

  if (!isAdmin && permissions.size === 0) {
    return (
      <div className="page">
        <div className="card">
          <Empty title="Your access hasn't been set up yet">
            Ask the admin to give you access to the areas you work on (e.g. Accounts & Tax, Legal).
          </Empty>
        </div>
      </div>
    );
  }

  const today = todayISO();
  const in30 = addDays(today, 30);
  const fy = fyStartYear(today);
  const fyStart = `${fy}-04-01`;
  const all = filings.data ?? [];
  const overdue = all.filter((f) => filingDueState(f, today) === "overdue");
  const next30 = all.filter((f) => {
    const s = filingDueState(f, today);
    return (s === "due_soon" || s === "upcoming") && f.due_date <= in30;
  });
  const filedThisFy = all.filter((f) => f.status === "filed" && (f.filed_on ?? f.updated_at.slice(0, 10)) >= fyStart);
  const reqs = requests.data ?? [];
  const pendingOnUs = reqs.filter((r) => r.status === "open" || r.status === "rejected");
  const toReview = reqs.filter((r) => r.status === "submitted");
  const sharedThisMonth = (documents.data ?? []).filter((d) => d.created_at.slice(0, 7) === today.slice(0, 7)).length;

  const attention = [...overdue, ...next30].slice(0, 8);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Hello{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}</h1>
          <p>{formatDate(today)} · {fyLabel(fy)} · {areas.length} area{areas.length === 1 ? "" : "s"}</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <Link to="/filings?tab=overdue" className="card stat">
          <div className="stat-label">Overdue filings</div>
          <div className={`stat-value${overdue.length ? " red" : ""}`}>{overdue.length}</div>
        </Link>
        <Link to="/filings?tab=upcoming" className="card stat">
          <div className="stat-label">Due in next 30 days</div>
          <div className={`stat-value${next30.length ? " amber" : ""}`}>{next30.length}</div>
        </Link>
        <Link to="/requests" className="card stat">
          <div className="stat-label">Documents still to send</div>
          <div className="stat-value">{pendingOnUs.length}</div>
        </Link>
        <Link to="/filings?tab=filed" className="card stat">
          <div className="stat-label">Filed in {fyLabel(fy)}</div>
          <div className="stat-value green">{filedThisFy.length}</div>
        </Link>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-head">
            <h2>Filings needing attention</h2>
            <Link to="/filings" className="small">All filings →</Link>
          </div>
          {attention.length === 0 ? (
            <Empty title="Nothing due in the next 30 days">
              {all.length === 0 && isAdmin ? "Go to Filings to generate this year's compliance calendar." : null}
            </Empty>
          ) : (
            <ul className="list">
              {attention.map((f) => (
                <li key={f.id} className="list-item clickable" onClick={() => setOpenFiling(f.id)}>
                  <div className="grow">
                    <div className="cell-title">{f.title}{f.period && <span className="muted"> · {f.period}</span>}</div>
                    <div className="cell-sub">{formatDate(f.due_date)} · {relativeDue(f.due_date, today)}</div>
                  </div>
                  <FilingBadge filing={f} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Document requests</h2>
            <Link to="/requests" className="small">All requests →</Link>
          </div>
          {pendingOnUs.length + toReview.length === 0 ? (
            <Empty title="No open document requests" />
          ) : (
            <ul className="list">
              {[...pendingOnUs, ...toReview].slice(0, 8).map((r) => (
                <li key={r.id} className="list-item clickable" onClick={() => setOpenRequest(r.id)}>
                  <div className="grow">
                    <div className="cell-title">{r.title}</div>
                    <div className="cell-sub">
                      Asked by {personName(r.requested_by)}
                      {r.due_date ? ` · needed by ${formatDate(r.due_date)}` : ""}
                    </div>
                  </div>
                  <RequestBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Recent activity</h2>
            <Link to="/activity" className="small">Full log →</Link>
          </div>
          {(activity.data ?? []).length === 0 ? (
            <Empty title="No activity yet" />
          ) : (
            <ul className="list">
              {(activity.data ?? []).slice(0, 8).map((a) => (
                <li key={a.id} className="list-item">
                  <div className="grow">
                    <div>{a.summary}</div>
                    <div className="cell-sub">{personName(a.actor_id)} · {formatDateTime(a.created_at)}</div>
                  </div>
                  {a.area_id && <AreaTag area={areaById.get(a.area_id)} />}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Areas</h2>
            <span className="faint small">{sharedThisMonth} document{sharedThisMonth === 1 ? "" : "s"} shared this month</span>
          </div>
          <ul className="list">
            {areas.map((a) => {
              const af = all.filter((f) => f.area_id === a.id);
              const late = af.filter((f) => filingDueState(f, today) === "overdue").length;
              const open = reqs.filter((r) => r.area_id === a.id && (r.status === "open" || r.status === "rejected")).length;
              return (
                <li key={a.id} className="list-item">
                  <div className="grow">
                    <AreaTag area={a} />
                    <div className="cell-sub">{a.description}</div>
                  </div>
                  <div className="small muted nowrap" style={{ textAlign: "right" }}>
                    {late > 0 && <div style={{ color: "var(--red)" }}>{late} overdue</div>}
                    <div>{open} doc request{open === 1 ? "" : "s"} open</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {openFiling && <FilingModal filingId={openFiling} onClose={() => setOpenFiling(null)} />}
      {openRequest && <RequestModal requestId={openRequest} onClose={() => setOpenRequest(null)} />}
    </div>
  );
}
