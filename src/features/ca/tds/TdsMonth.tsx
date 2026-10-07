import { useState } from "react";
import { addTdsPayments, keys, useWrite } from "../../../api";
import { Empty, ErrorBox, Icon, Loading } from "../../../components/ui";
import { formatDate, relativeDue, todayISO } from "../../../lib/dates";
import { formatINR } from "../../../lib/format";
import { useAuth } from "../../auth/AuthContext";
import { MarkPaidModal } from "./MarkPaidModal";
import { TdsPaymentModal } from "./TdsPaymentModal";
import { TdsTable } from "./TdsTable";
import { addMonths, monthLabel, tdsDueDate, toPaymentRow } from "./tdsLogic";
import { useTdsMonth } from "./useTdsMonth";

export function TdsMonth({ month, onMonth }: { month: string; onMonth: (m: string) => void }) {
  const { can } = useAuth();
  const data = useTdsMonth(month);
  const [open, setOpen] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const add = useWrite(() => addTdsPayments(data.missing.map((e) => toPaymentRow(month, e))), [keys.tdsPayments]);
  const due = tdsDueDate(month);
  const late = data.pending.length > 0 && due < todayISO();
  const openRow = data.rows.find((r) => r.id === open);

  return (
    <>
      <div className="card card-pad tds-summary">
        <div className="actions">
          <button className="icon-btn" aria-label="Previous month" onClick={() => onMonth(addMonths(month, -1))}>‹</button>
          <h2>{monthLabel(month)}</h2>
          <button className="icon-btn" aria-label="Next month" onClick={() => onMonth(addMonths(month, 1))}>›</button>
        </div>
        <div><span className="muted">Due</span> {formatDate(due)}{data.pending.length > 0 && <span className={late ? "text-red" : "muted"}> · {relativeDue(due)}</span>}</div>
        <div><span className="muted">Total TDS</span> <strong>{formatINR(data.total)}</strong></div>
        <div><span className="muted">People</span> {data.rows.length} · {data.pending.length} pending</div>
        <span className="spacer" />
        {can("ca.tds", "edit") && data.pending.length > 0 && (
          <button className="btn btn-primary btn-sm" onClick={() => setPaying(true)}>Mark {data.pending.length} as paid</button>
        )}
      </div>

      {can("ca.tds", "edit") && data.missing.length > 0 && (
        <div className="alert alert-info tds-missing">
          <span>
            <strong>{data.missing.length}</strong> {data.missing.length === 1 ? "person is" : "people are"} eligible for TDS this month but not in the register:{" "}
            {data.missing.map((e) => `${e.person.full_name} (${e.rule.section})`).join(", ")}
          </span>
          <button className="btn btn-sm" disabled={add.isPending} onClick={() => add.mutate(undefined)}>
            <Icon name="plus" size={15} /> Add to register
          </button>
        </div>
      )}
      <ErrorBox error={add.error ?? data.error} />

      <div className="card">
        {data.isLoading ? (
          <Loading />
        ) : data.rows.length === 0 ? (
          <Empty title={`No TDS recorded for ${monthLabel(month)}`}>
            {can("ca.tds", "edit") && "Eligible people show above once their salary is in HR and a TDS rule covers them."}
          </Empty>
        ) : (
          <TdsTable rows={data.rows} onOpen={setOpen} />
        )}
      </div>

      {openRow && <TdsPaymentModal payment={openRow} onClose={() => setOpen(null)} />}
      {paying && <MarkPaidModal rows={data.pending} onClose={() => setPaying(false)} />}
    </>
  );
}
