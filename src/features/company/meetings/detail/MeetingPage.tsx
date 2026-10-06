import { Link, useParams } from "react-router-dom";
import { useMeetings } from "../../../../api";
import { Empty, Loading } from "../../../../components/ui";
import { formatDate } from "../../../../lib/dates";
import { useAuth } from "../../../auth/AuthContext";
import { MEETING_TYPE_LABEL } from "../labels";
import { ActionsCard } from "./ActionsCard";
import { AgmFilingsCard } from "./AgmFilingsCard";
import { AttendeesCard } from "./AttendeesCard";
import { MeetingSummary } from "./MeetingSummary";
import { MinutesCard } from "./MinutesCard";
import { ResolutionsCard } from "./ResolutionsCard";

export function MeetingPage() {
  const { id } = useParams();
  const { can } = useAuth();
  const meetings = useMeetings();
  const meeting = meetings.data?.find((m) => m.id === id);

  if (meetings.isLoading) return <div className="page"><Loading /></div>;
  if (!meeting) return <div className="page"><div className="card"><Empty title="Meeting not found" /></div></div>;
  const editable = can("company.meetings", "edit");

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <Link to="/company/meetings" className="small">← Meetings</Link>
          <h1>{meeting.title}</h1>
          <p>{MEETING_TYPE_LABEL[meeting.meeting_type]} · {formatDate(meeting.meeting_date)}{meeting.start_time ? `, ${meeting.start_time}` : ""}</p>
        </div>
      </div>
      <div className="grid grid-2">
        <MeetingSummary meeting={meeting} />
        <MinutesCard meeting={meeting} editable={editable} />
        <AttendeesCard meetingId={meeting.id} editable={editable} />
        <ResolutionsCard meeting={meeting} editable={editable} />
        <ActionsCard meetingId={meeting.id} editable={editable} />
        {meeting.meeting_type === "agm" && <AgmFilingsCard meeting={meeting} />}
      </div>
    </div>
  );
}
