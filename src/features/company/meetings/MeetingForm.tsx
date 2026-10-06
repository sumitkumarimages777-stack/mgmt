import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { keys, saveMeeting, useWrite, type MeetingInput } from "../../../api";
import { ErrorBox, Modal } from "../../../components/ui";
import { fyLabel, fyStartYear, todayISO } from "../../../lib/dates";
import type { Meeting } from "../../../lib/types";
import { MeetingFields } from "./MeetingFields";

const clean = (v: string | null | undefined) => (v ? v : null);

export function MeetingForm({ meeting, onClose }: { meeting?: Meeting; onClose: () => void }) {
  const navigate = useNavigate();
  const [f, setF] = useState<MeetingInput>(
    meeting ?? { meeting_type: "board", title: "", meeting_date: todayISO(), mode: "in_person", status: "scheduled", financial_year: fyLabel(fyStartYear(todayISO()) - 1) },
  );
  const set = <K extends keyof MeetingInput>(k: K, v: MeetingInput[K]) => setF((x) => ({ ...x, [k]: v }));
  const save = useWrite((x: MeetingInput) => saveMeeting(meeting?.id ?? null, {
    meeting_type: x.meeting_type, title: x.title?.trim(), meeting_number: clean(x.meeting_number), meeting_date: x.meeting_date,
    start_time: clean(x.start_time), mode: x.mode, venue: clean(x.venue), status: x.status, notice_sent_on: clean(x.notice_sent_on),
    chairperson: clean(x.chairperson), quorum_met: x.quorum_met ?? null,
    financial_year: x.meeting_type === "agm" || x.meeting_type === "egm" ? clean(x.financial_year) : null,
  }), [keys.meetings]);
  const valid = !!f.title?.trim() && !!f.meeting_date;

  const submit = () =>
    save.mutate(f, {
      onSuccess: (saved) => {
        onClose();
        if (!meeting) navigate(`/company/meetings/${saved.id}`);
      },
    });

  const footer = (
    <>
      <button className="btn" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" disabled={!valid || save.isPending} onClick={submit}>{save.isPending ? "Saving…" : "Save"}</button>
    </>
  );

  return (
    <Modal title={meeting ? "Edit meeting" : "New meeting"} onClose={onClose} footer={footer}>
      <div className="form">
        <MeetingFields f={f} set={set} />
        <ErrorBox error={save.error} />
      </div>
    </Modal>
  );
}
