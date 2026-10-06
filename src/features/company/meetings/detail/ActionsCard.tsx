import { useState } from "react";
import { deleteMeetingPart, keys, saveMeetingPart, useLookups, useMeetingParts, useProfiles, useWrite } from "../../../../api";
import { ErrorBox, SectionCard } from "../../../../components/ui";
import { formatDate, todayISO } from "../../../../lib/dates";
import type { MeetingAction } from "../../../../lib/types";

export function ActionsCard({ meetingId, editable }: { meetingId: string; editable: boolean }) {
  const parts = useMeetingParts(meetingId);
  const profiles = useProfiles();
  const { personName } = useLookups();
  const [text, setText] = useState("");
  const [owner, setOwner] = useState("");
  const [due, setDue] = useState("");
  const k = [keys.meetingParts(meetingId), keys.meetingActions];
  const add = useWrite(() => saveMeetingPart("meeting_actions", null, { meeting_id: meetingId, description: text.trim(), owner_id: owner || null, due_date: due || null }), k);
  const toggle = useWrite((a: MeetingAction) =>
    saveMeetingPart("meeting_actions", a.id, a.status === "open" ? { status: "done", done_on: todayISO() } : { status: "open", done_on: null }), k);
  const remove = useWrite((id: string) => deleteMeetingPart("meeting_actions", id), k);
  const list = parts.data?.actions ?? [];

  return (
    <SectionCard title="Action items" aside={<span className="faint small">{list.filter((a) => a.status === "open").length} open</span>}>
      <ul className="list">
        {list.map((a) => (
          <li key={a.id} className="list-item">
            <input type="checkbox" checked={a.status === "done"} disabled={!editable} onChange={() => toggle.mutate(a)} style={{ marginTop: 3 }} />
            <div className="grow">
              <div className="cell-title" style={a.status === "done" ? { textDecoration: "line-through", color: "var(--faint)" } : undefined}>{a.description}</div>
              <div className="cell-sub">{personName(a.owner_id)}{a.due_date ? ` · due ${formatDate(a.due_date)}` : ""}{a.done_on ? ` · done ${formatDate(a.done_on)}` : ""}</div>
            </div>
            {editable && <button className="icon-btn" aria-label="Remove" onClick={() => remove.mutate(a.id)}>×</button>}
          </li>
        ))}
      </ul>
      {editable && (
        <form className="card-pad form" onSubmit={(e) => { e.preventDefault(); if (text.trim()) add.mutate(undefined, { onSuccess: () => { setText(""); setDue(""); } }); }}>
          <input className="input" placeholder="What needs to be done?" value={text} onChange={(e) => setText(e.target.value)} />
          <div className="actions" style={{ flexWrap: "nowrap" }}>
            <select className="select" value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option value="">Owner —</option>
              {(profiles.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
            </select>
            <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            <button className="btn btn-sm" disabled={!text.trim() || add.isPending}>Add</button>
          </div>
        </form>
      )}
      <ErrorBox error={add.error ?? toggle.error ?? remove.error} />
    </SectionCard>
  );
}
