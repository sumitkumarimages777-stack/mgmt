import type { MeetingInput } from "../../../api";
import { SelectField, TextField } from "../../../components/ui";
import { optionsFrom } from "../../../lib/options";
import type { MeetingMode, MeetingStatus, MeetingType } from "../../../lib/types";
import { MEETING_MODE_LABEL, MEETING_STATUS_LABEL, MEETING_TYPE_LABEL } from "./labels";

type Set = <K extends keyof MeetingInput>(k: K, v: MeetingInput[K]) => void;

export function MeetingFields({ f, set }: { f: MeetingInput; set: Set }) {
  const quorum = f.quorum_met === null || f.quorum_met === undefined ? "" : f.quorum_met ? "yes" : "no";
  return (
    <>
      <div className="form-row">
        <SelectField label="Type" value={f.meeting_type} onChange={(v) => set("meeting_type", v as MeetingType)} options={optionsFrom(MEETING_TYPE_LABEL)} />
        <TextField label="Meeting number" value={f.meeting_number} onChange={(v) => set("meeting_number", v)} placeholder="e.g. 12th Board Meeting" />
      </div>
      <TextField label="Title" value={f.title} onChange={(v) => set("title", v)} placeholder="e.g. Board meeting — Q2 results" />
      <div className="form-row">
        <TextField label="Date" type="date" value={f.meeting_date} onChange={(v) => set("meeting_date", v)} />
        <TextField label="Time" value={f.start_time} onChange={(v) => set("start_time", v)} placeholder="e.g. 11:00 AM" />
      </div>
      <div className="form-row">
        <SelectField label="Mode" value={f.mode} onChange={(v) => set("mode", v as MeetingMode)} options={optionsFrom(MEETING_MODE_LABEL)} />
        <TextField label="Venue / link" value={f.venue} onChange={(v) => set("venue", v)} />
      </div>
      <div className="form-row">
        <SelectField label="Status" value={f.status} onChange={(v) => set("status", v as MeetingStatus)} options={optionsFrom(MEETING_STATUS_LABEL)} />
        <TextField label="Notice sent on" type="date" value={f.notice_sent_on} onChange={(v) => set("notice_sent_on", v)} />
      </div>
      <div className="form-row">
        <TextField label="Chairperson" value={f.chairperson} onChange={(v) => set("chairperson", v)} />
        <SelectField label="Quorum present" allowEmpty value={quorum} onChange={(v) => set("quorum_met", v === "" ? null : v === "yes")}
          options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
      </div>
      {(f.meeting_type === "agm" || f.meeting_type === "egm") && (
        <TextField label="Financial year (accounts adopted)" value={f.financial_year} onChange={(v) => set("financial_year", v)} placeholder="e.g. FY 2025-26" hint="Used to update the AOC-4 and MGT-7 due dates." />
      )}
    </>
  );
}
