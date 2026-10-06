import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteMeeting, keys, useWrite } from "../../../../api";
import { ErrorBox } from "../../../../components/ui";
import { formatDate } from "../../../../lib/dates";
import type { Meeting } from "../../../../lib/types";
import { useAuth } from "../../../auth/AuthContext";
import { SectionCard } from "../../../../components/ui";
import { MEETING_MODE_LABEL, MEETING_STATUS_LABEL } from "../labels";
import { MeetingForm } from "../MeetingForm";

export function MeetingSummary({ meeting: m }: { meeting: Meeting }) {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const remove = useWrite(() => deleteMeeting(m.id), [keys.meetings]);
  const rows: Array<[string, string]> = [
    ["Status", MEETING_STATUS_LABEL[m.status]],
    ["Number", m.meeting_number || "—"],
    ["Mode", MEETING_MODE_LABEL[m.mode]],
    ["Venue / link", m.venue || "—"],
    ["Notice sent", formatDate(m.notice_sent_on)],
    ["Chairperson", m.chairperson || "—"],
    ["Quorum", m.quorum_met === null ? "—" : m.quorum_met ? "Present" : "Not present"],
  ];
  if (m.financial_year) rows.push(["Financial year", m.financial_year]);

  const confirmDelete = () => {
    if (confirm("Delete this meeting with its attendance, resolutions and actions?")) remove.mutate(undefined, { onSuccess: () => navigate("/company/meetings") });
  };

  return (
    <SectionCard title="Details">
      <div className="card-pad">
        <dl className="meta">
          {rows.map(([k, v]) => <div key={k} style={{ display: "contents" }}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>
        <div className="actions" style={{ marginTop: 14 }}>
          {can("company.meetings", "edit") && <button className="btn btn-sm" onClick={() => setEditing(true)}>Edit details</button>}
          {can("company.meetings", "manage") && <button className="btn btn-sm btn-ghost btn-danger" onClick={confirmDelete}>Delete</button>}
        </div>
        <ErrorBox error={remove.error} />
      </div>
      {editing && <MeetingForm meeting={m} onClose={() => setEditing(false)} />}
    </SectionCard>
  );
}
