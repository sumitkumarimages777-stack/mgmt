import { Link } from "react-router-dom";
import { useMeetings, useOpenMeetingActions } from "../../api";
import { Empty, SectionCard } from "../../components/ui";
import { addDays, formatDate, relativeDue, todayISO } from "../../lib/dates";
import { MEETING_TYPE_LABEL } from "../company/meetings/labels";

/** Next scheduled meetings and meeting action items due within two weeks (or late). */
export function MeetingsCard() {
  const meetings = useMeetings();
  const actions = useOpenMeetingActions();
  const today = todayISO();
  const upcoming = (meetings.data ?? [])
    .filter((m) => m.status === "scheduled" && m.meeting_date >= today)
    .sort((a, b) => a.meeting_date.localeCompare(b.meeting_date))
    .slice(0, 3);
  const due = (actions.data ?? []).filter((a) => a.due_date && a.due_date <= addDays(today, 14)).slice(0, 5);

  return (
    <SectionCard title="Meetings" link={{ to: "/company/meetings", label: "All meetings" }}>
      {upcoming.length + due.length === 0 ? (
        <Empty title="No meetings or actions coming up" />
      ) : (
        <ul className="list">
          {upcoming.map((m) => (
            <li key={m.id} className="list-item">
              <div className="grow">
                <Link to={`/company/meetings/${m.id}`} className="cell-title">{m.title}</Link>
                <div className="cell-sub">{MEETING_TYPE_LABEL[m.meeting_type]} · {formatDate(m.meeting_date)}{m.notice_sent_on ? "" : " · notice not sent yet"}</div>
              </div>
            </li>
          ))}
          {due.map((a) => (
            <li key={a.id} className="list-item">
              <div className="grow">
                <Link to={`/company/meetings/${a.meeting_id}`} className="cell-title">{a.description}</Link>
                <div className="cell-sub">Action item · {relativeDue(a.due_date!, today)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
