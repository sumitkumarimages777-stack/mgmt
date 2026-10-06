import { useNavigate } from "react-router-dom";
import { Tag } from "../../../components/ui";
import { formatDate, relativeDue, todayISO } from "../../../lib/dates";
import type { Meeting } from "../../../lib/types";
import { MEETING_MODE_LABEL, MEETING_STATUS_LABEL, MEETING_TYPE_LABEL } from "./labels";

const STATUS_BADGE = { scheduled: "badge-blue", held: "badge-green", cancelled: "badge-gray" } as const;

export function MeetingsTable({ rows }: { rows: Meeting[] }) {
  const navigate = useNavigate();
  const today = todayISO();
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Date</th><th>Meeting</th><th>Type</th><th>Where</th><th>Status</th></tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.id} className="clickable" onClick={() => navigate(`/company/meetings/${m.id}`)}>
              <td className="nowrap">
                {formatDate(m.meeting_date)}
                {m.status === "scheduled" && <div className="cell-sub">{relativeDue(m.meeting_date, today).replace("due ", "")}</div>}
              </td>
              <td>
                <div className="cell-title">{m.title}</div>
                {m.meeting_number && <div className="cell-sub">{m.meeting_number}</div>}
              </td>
              <td><Tag>{MEETING_TYPE_LABEL[m.meeting_type]}</Tag></td>
              <td>{MEETING_MODE_LABEL[m.mode]}{m.venue && <div className="cell-sub">{m.venue}</div>}</td>
              <td><span className={`badge ${STATUS_BADGE[m.status]}`}>{MEETING_STATUS_LABEL[m.status]}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
