import { useState } from "react";
import { keys, saveMeeting, useDocuments, useWrite } from "../../../../api";
import { ErrorBox, Icon, TextField } from "../../../../components/ui";
import { formatDate } from "../../../../lib/dates";
import type { Meeting } from "../../../../lib/types";
import { SectionCard } from "../../../../components/ui";
import { DocumentTable } from "../../../documents/DocumentTable";
import { DocumentUploadModal } from "../../../documents/DocumentUploadModal";

/** Agenda, minutes text, signed date and files (notice, signed minutes, attendance sheet). */
export function MinutesCard({ meeting: m, editable }: { meeting: Meeting; editable: boolean }) {
  const documents = useDocuments();
  const [draft, setDraft] = useState<{ agenda: string; minutes: string; signed: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const save = useWrite((d: { agenda: string; minutes: string; signed: string }) =>
    saveMeeting(m.id, { agenda: d.agenda || null, minutes: d.minutes || null, minutes_signed_on: d.signed || null }), [keys.meetings]);
  const docs = (documents.data ?? []).filter((d) => d.meeting_id === m.id);

  return (
    <SectionCard title="Agenda & minutes">
      <div className="card-pad form">
        {draft ? (
          <>
            <label className="field"><span>Agenda</span><textarea className="textarea" value={draft.agenda} onChange={(e) => setDraft({ ...draft, agenda: e.target.value })} /></label>
            <label className="field"><span>Minutes</span><textarea className="textarea" style={{ minHeight: 140 }} value={draft.minutes} onChange={(e) => setDraft({ ...draft, minutes: e.target.value })} /></label>
            <TextField label="Minutes signed on" type="date" value={draft.signed} onChange={(v) => setDraft({ ...draft, signed: v })} />
            <div className="actions">
              <button className="btn btn-primary btn-sm" disabled={save.isPending} onClick={() => save.mutate(draft, { onSuccess: () => setDraft(null) })}>Save</button>
              <button className="btn btn-sm" onClick={() => setDraft(null)}>Cancel</button>
            </div>
            <ErrorBox error={save.error} />
          </>
        ) : (
          <>
            <div><div className="section-title" style={{ marginTop: 0 }}>Agenda</div><div className="pre">{m.agenda || <span className="faint">Not added</span>}</div></div>
            <div><div className="section-title">Minutes {m.minutes_signed_on && <span className="badge badge-green">Signed {formatDate(m.minutes_signed_on)}</span>}</div><div className="pre">{m.minutes || <span className="faint">Not added</span>}</div></div>
            {editable && <div><button className="btn btn-sm" onClick={() => setDraft({ agenda: m.agenda ?? "", minutes: m.minutes ?? "", signed: m.minutes_signed_on ?? "" })}>Edit agenda & minutes</button></div>}
          </>
        )}
        <div className="section-title">Files ({docs.length})</div>
        <DocumentTable docs={docs} showSource={false} />
        {editable && <div><button className="btn btn-sm" onClick={() => setUploading(true)}><Icon name="plus" size={15} /> Add notice, minutes or other file</button></div>}
      </div>
      {uploading && (
        <DocumentUploadModal defaults={{ module: "company", feature: "meetings", meeting_id: m.id, title: `${m.title} — minutes`, category: "Company records" }} onClose={() => setUploading(false)} />
      )}
    </SectionCard>
  );
}
