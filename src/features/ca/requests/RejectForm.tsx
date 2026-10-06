import { useState } from "react";

/** Ask the sender to re-upload, with a reason that's posted as a comment. */
export function RejectForm({ busy, onSend, onCancel }: { busy: boolean; onSend: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState("");
  return (
    <div className="card card-pad form" style={{ marginTop: 14 }}>
      <label className="field">
        <span>What's wrong / what is needed instead?</span>
        <textarea className="textarea" value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      <div className="actions">
        <button className="btn btn-primary btn-sm" disabled={!reason.trim() || busy} onClick={() => onSend(reason.trim())}>
          Send back
        </button>
        <button className="btn btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
