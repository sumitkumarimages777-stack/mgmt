import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Meeting, MeetingAction, MeetingAttendee, MeetingResolution } from "../lib/types";
import { keys, unwrap } from "./core";

export function useMeetings(enabled = true) {
  return useQuery({
    queryKey: keys.meetings,
    enabled,
    queryFn: () => unwrap<Meeting[]>(supabase.from("meetings").select("*").order("meeting_date", { ascending: false })),
  });
}

export type MeetingInput = Partial<Omit<Meeting, "id" | "created_at">>;

export async function saveMeeting(id: string | null, input: MeetingInput) {
  if (id) return unwrap<Meeting>(supabase.from("meetings").update(input).eq("id", id).select().single());
  return unwrap<Meeting>(supabase.from("meetings").insert(input).select().single());
}

export async function deleteMeeting(id: string) {
  await unwrap(supabase.from("meetings").delete().eq("id", id));
}

/** Attendees, resolutions and actions of one meeting. */
export function useMeetingParts(meetingId: string) {
  return useQuery({
    queryKey: keys.meetingParts(meetingId),
    queryFn: async () => {
      const [attendees, resolutions, actions] = await Promise.all([
        unwrap<MeetingAttendee[]>(supabase.from("meeting_attendees").select("*").eq("meeting_id", meetingId).order("created_at")),
        unwrap<MeetingResolution[]>(supabase.from("meeting_resolutions").select("*").eq("meeting_id", meetingId).order("created_at")),
        unwrap<MeetingAction[]>(supabase.from("meeting_actions").select("*").eq("meeting_id", meetingId).order("due_date")),
      ]);
      return { attendees, resolutions, actions };
    },
  });
}

/** Open action items across all meetings (for the dashboard). */
export function useOpenMeetingActions(enabled = true) {
  return useQuery({
    queryKey: keys.meetingActions,
    enabled,
    queryFn: () => unwrap<MeetingAction[]>(supabase.from("meeting_actions").select("*").eq("status", "open").order("due_date")),
  });
}

type Part = "meeting_attendees" | "meeting_resolutions" | "meeting_actions";

/** Insert or update a row in one of the meeting child tables. */
export async function saveMeetingPart<T extends object>(table: Part, id: string | null, input: T) {
  if (id) await unwrap(supabase.from(table).update(input).eq("id", id));
  else await unwrap(supabase.from(table).insert(input));
}

export async function deleteMeetingPart(table: Part, id: string) {
  await unwrap(supabase.from(table).delete().eq("id", id));
}
