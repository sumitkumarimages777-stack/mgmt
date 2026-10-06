import type { MeetingMode, MeetingResolution, MeetingStatus, MeetingType } from "../../../lib/types";

export const MEETING_TYPE_LABEL: Record<MeetingType, string> = {
  board: "Board meeting",
  agm: "AGM",
  egm: "EGM",
  committee: "Committee meeting",
  other: "Other",
};

export const MEETING_STATUS_LABEL: Record<MeetingStatus, string> = {
  scheduled: "Scheduled",
  held: "Held",
  cancelled: "Cancelled",
};

export const MEETING_MODE_LABEL: Record<MeetingMode, string> = {
  in_person: "In person",
  online: "Online",
  hybrid: "Hybrid",
};

export const RESOLUTION_TYPE_LABEL: Record<MeetingResolution["resolution_type"], string> = {
  board: "Board resolution",
  ordinary: "Ordinary resolution",
  special: "Special resolution",
};

export const RESOLUTION_STATUS_LABEL: Record<MeetingResolution["status"], string> = {
  passed: "Passed",
  rejected: "Not passed",
  deferred: "Deferred",
};

export const ATTENDEE_CAPACITIES = ["Director", "Managing Director", "Shareholder", "Proxy", "Auditor", "Company Secretary", "Invitee"];
