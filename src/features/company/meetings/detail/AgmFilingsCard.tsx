import { Link } from "react-router-dom";
import { keys, upsertFilings, useFilings, useWrite } from "../../../../api";
import { ErrorBox, SectionCard } from "../../../../components/ui";
import { formatDate } from "../../../../lib/dates";
import type { Meeting } from "../../../../lib/types";
import { useAuth } from "../../../auth/AuthContext";
import { AGM_FILINGS, rocDatesFromAgm } from "../meetingRules";

/** After an AGM: AOC-4 (30 days) and MGT-7 (60 days) for the financial year it adopted. */
export function AgmFilingsCard({ meeting: m }: { meeting: Meeting }) {
  const { can } = useAuth();
  const filings = useFilings(can("ca.filings"));
  const dates = rocDatesFromAgm(m.meeting_date);
  const fy = m.financial_year;
  const update = useWrite(() => upsertFilings(AGM_FILINGS.map((f) => ({
    title: f.title, form_code: f.form_code, period: fy!, category: "ROC / MCA", due_date: dates[f.key],
  }))), [keys.filings]);
  const existing = (title: string) => filings.data?.find((f) => f.title === title && f.period === fy);

  return (
    <SectionCard title="ROC filings after this AGM">
      <div className="card-pad form">
        <ul className="list">
          {AGM_FILINGS.map((f) => {
            const current = existing(f.title);
            return (
              <li key={f.key} className="list-item" style={{ padding: "8px 0" }}>
                <div className="grow">
                  <div className="cell-title">{f.form_code}</div>
                  <div className="cell-sub">Due {formatDate(dates[f.key])} ({f.key === "aoc4" ? 30 : 60} days after the AGM)</div>
                </div>
                <span className="small muted">{current ? `In Filings: due ${formatDate(current.due_date)}` : "Not in Filings yet"}</span>
              </li>
            );
          })}
        </ul>
        {!fy ? (
          <div className="alert alert-info">Add the financial year on this AGM (Edit details) to link it to its filings.</div>
        ) : m.status !== "held" ? (
          <div className="alert alert-info">Once the AGM is marked as held, you can set these due dates in Filings.</div>
        ) : can("ca.filings", "edit") ? (
          <div>
            <button className="btn btn-sm btn-primary" disabled={update.isPending} onClick={() => update.mutate(undefined)}>Set these due dates in Filings ({fy})</button>
            {update.isSuccess && <span className="small" style={{ marginLeft: 10 }}>Updated. <Link to="/ca/filings?tab=all">View filings</Link></span>}
          </div>
        ) : null}
        <ErrorBox error={update.error} />
      </div>
    </SectionCard>
  );
}
