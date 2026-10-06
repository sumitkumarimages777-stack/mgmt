import { useState } from "react";
import { deleteMeetingPart, keys, saveMeetingPart, useMeetingParts, useWrite } from "../../../../api";
import { ErrorBox, SectionCard } from "../../../../components/ui";
import type { MeetingAttendee } from "../../../../lib/types";
import { ATTENDEE_CAPACITIES } from "../labels";

export function AttendeesCard({ meetingId, editable }: { meetingId: string; editable: boolean }) {
  const parts = useMeetingParts(meetingId);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(ATTENDEE_CAPACITIES[0]);
  const k = [keys.meetingParts(meetingId)];
  const add = useWrite(() => saveMeetingPart("meeting_attendees", null, { meeting_id: meetingId, name: name.trim(), capacity }), k);
  const toggle = useWrite((a: MeetingAttendee) => saveMeetingPart("meeting_attendees", a.id, { present: !a.present }), k);
  const remove = useWrite((id: string) => deleteMeetingPart("meeting_attendees", id), k);
  const list = parts.data?.attendees ?? [];
  const present = list.filter((a) => a.present).length;

  return (
    <SectionCard title="Attendance" aside={<span className="faint small">{present} of {list.length} present</span>}>
      <ul className="list">
        {list.map((a) => (
          <li key={a.id} className="list-item">
            <div className="grow">
              <div className="cell-title">{a.name}</div>
              <div className="cell-sub">{a.capacity}</div>
            </div>
            <button className={`badge ${a.present ? "badge-green" : "badge-gray"}`} style={{ border: 0, cursor: editable ? "pointer" : "default" }} disabled={!editable} onClick={() => toggle.mutate(a)}>
              {a.present ? "Present" : "Absent"}
            </button>
            {editable && <button className="icon-btn" aria-label="Remove" onClick={() => remove.mutate(a.id)}>×</button>}
          </li>
        ))}
      </ul>
      {editable && (
        <form className="card-pad actions" style={{ flexWrap: "nowrap" }} onSubmit={(e) => { e.preventDefault(); if (name.trim()) add.mutate(undefined, { onSuccess: () => setName("") }); }}>
          <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <select className="select" style={{ width: "auto" }} value={capacity} onChange={(e) => setCapacity(e.target.value)}>
            {ATTENDEE_CAPACITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <button className="btn btn-sm" disabled={!name.trim() || add.isPending}>Add</button>
        </form>
      )}
      <ErrorBox error={add.error ?? toggle.error ?? remove.error} />
    </SectionCard>
  );
}
