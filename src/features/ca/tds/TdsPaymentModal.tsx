import { useState } from "react";
import { deleteTdsPayment, keys, updateTdsPayment, useWrite, type TdsPaymentInput } from "../../../api";
import { ErrorBox, Modal, SelectField, TextField } from "../../../components/ui";
import { formatINR } from "../../../lib/format";
import type { TdsPayment, TdsPaymentStatus } from "../../../lib/types";
import { useAuth } from "../../auth/AuthContext";
import { monthLabel } from "./tdsLogic";

export function TdsPaymentModal({ payment, onClose }: { payment: TdsPayment; onClose: () => void }) {
  const { can } = useAuth();
  const editable = can("ca.tds", "edit");
  const [amount, setAmount] = useState(String(payment.tds_amount));
  const [status, setStatus] = useState<TdsPaymentStatus>(payment.status);
  const [paidOn, setPaidOn] = useState(payment.paid_on ?? "");
  const [challan, setChallan] = useState(payment.challan_number ?? "");
  const [notes, setNotes] = useState(payment.notes ?? "");
  const save = useWrite((input: Partial<TdsPaymentInput>) => updateTdsPayment(payment.id, input), [keys.tdsPayments]);
  const remove = useWrite(() => deleteTdsPayment(payment.id), [keys.tdsPayments]);
  const valid = Number(amount) >= 0 && amount !== "" && (status === "pending" || !!paidOn);

  const submit = () =>
    save.mutate(
      {
        tds_amount: Number(amount),
        status,
        paid_on: status === "paid" ? paidOn : null,
        challan_number: challan.trim() || null,
        notes: notes.trim() || null,
      },
      { onSuccess: onClose },
    );

  const footer = (
    <>
      {can("ca.tds", "manage") && (
        <button
          className="btn btn-ghost btn-danger"
          disabled={remove.isPending}
          onClick={() => confirm("Remove this person from the month's register?") && remove.mutate(undefined, { onSuccess: onClose })}
        >
          Delete
        </button>
      )}
      <span className="spacer" />
      <button className="btn" onClick={onClose}>{editable ? "Cancel" : "Close"}</button>
      {editable && <button className="btn btn-primary" disabled={!valid || save.isPending} onClick={submit}>Save</button>}
    </>
  );

  return (
    <Modal title={<>{payment.employee_name}<span className="muted"> · {monthLabel(payment.month)}</span></>} onClose={onClose} footer={footer}>
      <div className="form">
        <p className="muted">
          Section {payment.section} · PAN {payment.pan || "not on file"} · Monthly salary {formatINR(payment.salary_amount)}
        </p>
        <fieldset disabled={!editable} className="form plain-fieldset">
          <div className="form-row">
            <TextField label="TDS amount (₹)" type="number" value={amount} onChange={setAmount} />
            <SelectField
              label="Status"
              value={status}
              onChange={(v) => setStatus(v as TdsPaymentStatus)}
              options={[{ value: "pending", label: "Pending" }, { value: "paid", label: "Paid" }]}
            />
          </div>
          {status === "paid" && (
            <div className="form-row">
              <TextField label="Paid on" type="date" value={paidOn} onChange={setPaidOn} />
              <TextField label="Challan no. / CIN" value={challan} onChange={setChallan} />
            </div>
          )}
          <TextField label="Notes" value={notes} onChange={setNotes} />
        </fieldset>
        <ErrorBox error={save.error ?? remove.error} />
      </div>
    </Modal>
  );
}
