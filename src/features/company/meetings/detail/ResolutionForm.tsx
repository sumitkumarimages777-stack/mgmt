import { useState } from "react";
import { keys, saveMeetingPart, useWrite } from "../../../../api";
import { ErrorBox, Modal, SelectField, TextField } from "../../../../components/ui";
import { optionsFrom } from "../../../../lib/options";
import type { MeetingResolution } from "../../../../lib/types";
import { RESOLUTION_STATUS_LABEL, RESOLUTION_TYPE_LABEL } from "../labels";

type Input = Omit<MeetingResolution, "id" | "filing_id">;

export function ResolutionForm({ meetingId, resolution, onClose }: { meetingId: string; resolution?: MeetingResolution; onClose: () => void }) {
  const [f, setF] = useState<Input>(resolution ?? {
    meeting_id: meetingId, resolution_number: "", title: "", resolution_type: "board", status: "passed", requires_filing: false, details: "",
  });
  const set = <K extends keyof Input>(k: K, v: Input[K]) => setF((x) => ({ ...x, [k]: v }));
  const save = useWrite((x: Input) => saveMeetingPart("meeting_resolutions", resolution?.id ?? null, {
    meeting_id: meetingId, resolution_number: x.resolution_number || null, title: x.title.trim(), resolution_type: x.resolution_type,
    status: x.status, requires_filing: x.requires_filing, details: x.details || null,
  }), [keys.meetingParts(meetingId)]);

  const footer = (
    <>
      <button className="btn" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" disabled={!f.title.trim() || save.isPending} onClick={() => save.mutate(f, { onSuccess: onClose })}>Save</button>
    </>
  );

  return (
    <Modal title={resolution ? "Edit resolution" : "Add resolution"} onClose={onClose} footer={footer}>
      <div className="form">
        <div className="form-row">
          <TextField label="Number" value={f.resolution_number} onChange={(v) => set("resolution_number", v)} placeholder="e.g. BR-2026-07" />
          <SelectField label="Type" value={f.resolution_type} onChange={(v) => set("resolution_type", v as Input["resolution_type"])} options={optionsFrom(RESOLUTION_TYPE_LABEL)} />
        </div>
        <TextField label="Resolution" value={f.title} onChange={(v) => set("title", v)} placeholder="e.g. Approval of audited financial statements" />
        <SelectField label="Outcome" value={f.status} onChange={(v) => set("status", v as Input["status"])} options={optionsFrom(RESOLUTION_STATUS_LABEL)} />
        <label className="check">
          <input type="checkbox" checked={f.requires_filing} onChange={(e) => set("requires_filing", e.target.checked)} />
          <span>Needs filing with the ROC (MGT-14)</span>
        </label>
        <label className="field">
          <span>Details</span>
          <textarea className="textarea" value={f.details ?? ""} onChange={(e) => set("details", e.target.value)} />
        </label>
        <ErrorBox error={save.error} />
      </div>
    </Modal>
  );
}
