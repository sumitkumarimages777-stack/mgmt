import { keys, saveFiling, saveMeetingPart, useWrite } from "../../../../api";
import { formatDate } from "../../../../lib/dates";
import type { Meeting, MeetingResolution } from "../../../../lib/types";
import { mgt14Due } from "../meetingRules";

/** Create the MGT-14 filing for a resolution (due 30 days after the meeting) and link it. */
export function useMgt14Filing(meeting: Meeting) {
  return useWrite(async (r: MeetingResolution) => {
    const filing = await saveFiling(null, {
      category: "ROC / MCA",
      title: `MGT-14 — ${r.title}`,
      form_code: "MGT-14",
      period: formatDate(meeting.meeting_date),
      due_date: mgt14Due(meeting.meeting_date),
      status: "pending",
      notes: `From ${meeting.title}${r.resolution_number ? `, resolution ${r.resolution_number}` : ""}`,
    });
    await saveMeetingPart("meeting_resolutions", r.id, { filing_id: filing.id });
  }, [keys.meetingParts(meeting.id), keys.filings]);
}
