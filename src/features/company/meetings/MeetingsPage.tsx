import { useMemo, useState } from "react";
import { useMeetings } from "../../../api";
import { Empty, Icon, Loading, Tabs } from "../../../components/ui";
import { optionsFrom } from "../../../lib/options";
import type { Meeting, MeetingType } from "../../../lib/types";
import { useAuth } from "../../auth/AuthContext";
import { MEETING_TYPE_LABEL } from "./labels";
import { MeetingForm } from "./MeetingForm";
import { MeetingsTable } from "./MeetingsTable";

type Tab = "upcoming" | "held" | "all";

export function MeetingsPage() {
  const { can } = useAuth();
  const meetings = useMeetings();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [type, setType] = useState<MeetingType | "">("");
  const [adding, setAdding] = useState(false);

  const groups = useMemo(() => {
    const all = (meetings.data ?? []).filter((m) => !type || m.meeting_type === type);
    return {
      // soonest first for upcoming; most recent first otherwise
      upcoming: all.filter((m) => m.status === "scheduled").sort((a, b) => a.meeting_date.localeCompare(b.meeting_date)),
      held: all.filter((m) => m.status === "held"),
      all,
    } satisfies Record<Tab, Meeting[]>;
  }, [meetings.data, type]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Meetings</h1>
          <p>Board meetings, AGMs and EGMs — notices, attendance, minutes, resolutions and follow-ups, all on record.</p>
        </div>
        {can("company.meetings", "edit") && (
          <button className="btn btn-primary" onClick={() => setAdding(true)}><Icon name="plus" size={16} /> New meeting</button>
        )}
      </div>
      <div className="toolbar">
        <Tabs value={tab} onChange={setTab} items={[
          { value: "upcoming", label: "Upcoming", count: groups.upcoming.length },
          { value: "held", label: "Held", count: groups.held.length },
          { value: "all", label: "All", count: groups.all.length },
        ]} />
        <select className="select" value={type} onChange={(e) => setType(e.target.value as MeetingType | "")}>
          <option value="">All types</option>
          {optionsFrom(MEETING_TYPE_LABEL).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="card">
        {meetings.isLoading ? <Loading /> : groups[tab].length === 0 ? <Empty title="No meetings here" /> : <MeetingsTable rows={groups[tab]} />}
      </div>
      {adding && <MeetingForm onClose={() => setAdding(false)} />}
    </div>
  );
}
