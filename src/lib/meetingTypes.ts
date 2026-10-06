// Company meetings types (re-exported from types.ts).
export type MeetingType = "board" | "agm" | "egm" | "committee" | "other";
export type MeetingStatus = "scheduled" | "held" | "cancelled";
export type MeetingMode = "in_person" | "online" | "hybrid";

export interface Meeting {
  id: string;
  meeting_type: MeetingType;
  title: string;
  meeting_number: string | null;
  financial_year: string | null;
  meeting_date: string;
  start_time: string | null;
  mode: MeetingMode;
  venue: string | null;
  status: MeetingStatus;
  notice_sent_on: string | null;
  chairperson: string | null;
  quorum_met: boolean | null;
  agenda: string | null;
  minutes: string | null;
  minutes_signed_on: string | null;
  notes: string | null;
  created_at: string;
}

export interface MeetingAttendee {
  id: string;
  meeting_id: string;
  name: string;
  capacity: string | null;
  present: boolean;
}

export interface MeetingResolution {
  id: string;
  meeting_id: string;
  resolution_number: string | null;
  title: string;
  resolution_type: "board" | "ordinary" | "special";
  status: "passed" | "rejected" | "deferred";
  requires_filing: boolean;
  filing_id: string | null;
  details: string | null;
}

export interface MeetingAction {
  id: string;
  meeting_id: string;
  description: string;
  owner_id: string | null;
  due_date: string | null;
  status: "open" | "done";
  done_on: string | null;
}
