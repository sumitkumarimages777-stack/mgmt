import { useState } from "react";
import { Link } from "react-router-dom";
import { useFilings, useMeetingParts } from "../../../../api";
import { ErrorBox, Icon, SectionCard } from "../../../../components/ui";
import { formatDate } from "../../../../lib/dates";
import type { Meeting, MeetingResolution } from "../../../../lib/types";
import { useAuth } from "../../../auth/AuthContext";
import { RESOLUTION_STATUS_LABEL, RESOLUTION_TYPE_LABEL } from "../labels";
import { ResolutionForm } from "./ResolutionForm";
import { useMgt14Filing } from "./useMgt14Filing";

export function ResolutionsCard({ meeting, editable }: { meeting: Meeting; editable: boolean }) {
  const { can } = useAuth();
  const parts = useMeetingParts(meeting.id);
  const filings = useFilings(can("ca.filings"));
  const [editing, setEditing] = useState<MeetingResolution | "new" | null>(null);
  const createFiling = useMgt14Filing(meeting);
  const list = parts.data?.resolutions ?? [];
  const filingOf = (id: string | null) => filings.data?.find((f) => f.id === id);

  return (
    <SectionCard title="Resolutions" aside={editable ? <button className="btn btn-sm" onClick={() => setEditing("new")}><Icon name="plus" size={15} /> Add</button> : undefined}>
      {list.length === 0 && <p className="card-pad faint small" style={{ margin: 0 }}>No resolutions recorded.</p>}
      <ul className="list">
        {list.map((r) => {
          const filing = filingOf(r.filing_id);
          return (
            <li key={r.id} className={`list-item${editable ? " clickable" : ""}`} onClick={() => editable && setEditing(r)}>
              <div className="grow">
                <div className="cell-title">{r.resolution_number ? `${r.resolution_number}: ` : ""}{r.title}</div>
                <div className="cell-sub">{RESOLUTION_TYPE_LABEL[r.resolution_type]} · {RESOLUTION_STATUS_LABEL[r.status]}</div>
                {r.requires_filing && (
                  <div className="cell-sub" onClick={(e) => e.stopPropagation()}>
                    {filing ? (
                      <Link to="/ca/filings?tab=all">MGT-14 {filing.status === "filed" ? `filed ${formatDate(filing.filed_on)}` : `due ${formatDate(filing.due_date)}`}</Link>
                    ) : r.filing_id ? "MGT-14 filing linked" : r.status === "passed" && can("ca.filings", "edit") ? (
                      <button className="btn btn-sm" disabled={createFiling.isPending} onClick={() => createFiling.mutate(r)}>Add MGT-14 filing</button>
                    ) : "MGT-14 needed"}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <ErrorBox error={createFiling.error} />
      {editing && <ResolutionForm meetingId={meeting.id} resolution={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    </SectionCard>
  );
}
