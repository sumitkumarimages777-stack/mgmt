import { useState } from "react";
import { todayISO } from "../../../../lib/dates";

interface Props {
  busy: boolean;
  onSave: (filedOn: string, ackNumber: string | null) => void;
  onCancel: () => void;
}

export function MarkFiledForm({ busy, onSave, onCancel }: Props) {
  const [filedOn, setFiledOn] = useState(todayISO());
  const [ack, setAck] = useState("");
  return (
    <div className="card card-pad" style={{ marginTop: 16 }}>
      <div className="form">
        <h3>Mark as filed</h3>
        <div className="form-row">
          <label className="field">
            <span>Filed on</span>
            <input className="input" type="date" value={filedOn} onChange={(e) => setFiledOn(e.target.value)} />
          </label>
          <label className="field">
            <span>Acknowledgement / ARN / SRN</span>
            <input className="input" value={ack} onChange={(e) => setAck(e.target.value)} />
          </label>
        </div>
        <div className="actions">
          <button className="btn btn-primary btn-sm" disabled={!filedOn || busy} onClick={() => onSave(filedOn, ack.trim() || null)}>
            Save
          </button>
          <button className="btn btn-sm" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
