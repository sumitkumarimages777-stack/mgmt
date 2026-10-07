import { useState } from "react";
import { keys, markTdsPaid, useWrite } from "../../../api";
import { ErrorBox, Modal, TextField } from "../../../components/ui";
import { todayISO } from "../../../lib/dates";
import { formatINR } from "../../../lib/format";
import type { TdsPayment } from "../../../lib/types";

/** Record one challan for every pending row of the month. */
export function MarkPaidModal({ rows, onClose }: { rows: TdsPayment[]; onClose: () => void }) {
  const [paidOn, setPaidOn] = useState(todayISO());
  const [challan, setChallan] = useState("");
  const save = useWrite(() => markTdsPaid(rows.map((r) => r.id), paidOn, challan.trim() || null), [keys.tdsPayments]);
  const total = rows.reduce((sum, r) => sum + Number(r.tds_amount), 0);

  const footer = (
    <>
      <span className="spacer" />
      <button className="btn" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" disabled={!paidOn || save.isPending} onClick={() => save.mutate(undefined, { onSuccess: onClose })}>
        Mark as paid
      </button>
    </>
  );

  return (
    <Modal title="Mark TDS as paid" onClose={onClose} footer={footer}>
      <div className="form">
        <p className="muted">{rows.length} {rows.length === 1 ? "person" : "people"} · {formatINR(total)}</p>
        <div className="form-row">
          <TextField label="Paid on" type="date" value={paidOn} onChange={setPaidOn} />
          <TextField label="Challan no. / CIN" value={challan} onChange={setChallan} placeholder="e.g. BSR + challan serial" />
        </div>
        <ErrorBox error={save.error} />
      </div>
    </Modal>
  );
}
