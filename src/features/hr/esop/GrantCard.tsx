import { useState } from "react";
import { formatDate, todayISO } from "../../../lib/dates";
import { formatCount, formatINR } from "../../../lib/format";
import type { EsopGrant } from "../../../lib/types";
import { useAuth } from "../../auth/AuthContext";
import { VESTING_FREQUENCY_LABEL } from "../labels";
import { GrantForm } from "./GrantForm";
import { fullyVestedOn, nextVesting, vestedOptions } from "./vesting";

/** One grant with its vesting progress. */
export function GrantCard({ grant: g, exitDate }: { grant: EsopGrant; exitDate: string | null }) {
  const { can } = useAuth();
  const [editing, setEditing] = useState(false);
  const today = todayISO();
  const vested = vestedOptions(g, today, exitDate);
  const next = nextVesting(g, today, exitDate);
  const pct = Math.round((vested / g.options) * 100);

  return (
    <div className="card card-pad">
      <div className="actions" style={{ justifyContent: "space-between" }}>
        <div>
          <h3>{formatCount(g.options)} options · granted {formatDate(g.grant_date)}</h3>
          <div className="cell-sub">
            Exercise price {formatINR(g.exercise_price)} · {g.vesting_months} months, {g.cliff_months}-month cliff, vests {VESTING_FREQUENCY_LABEL[g.vesting_frequency].toLowerCase()}
          </div>
        </div>
        {g.status === "cancelled" ? <span className="badge badge-gray">Cancelled</span> : can("hr.esop", "edit") && <button className="btn btn-sm" onClick={() => setEditing(true)}>Edit</button>}
      </div>
      <div style={{ background: "var(--surface-2)", borderRadius: 99, height: 10, margin: "14px 0 8px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "var(--green)" }} />
      </div>
      <div className="actions small" style={{ justifyContent: "space-between" }}>
        <span><strong>{formatCount(vested)}</strong> vested ({pct}%) · {formatCount(g.options - vested)} unvested</span>
        <span className="muted">
          {next ? `Next: ${formatCount(next.vested - vested)} on ${formatDate(next.date)}` : exitDate && exitDate < fullyVestedOn(g) ? `Vesting stopped at exit (${formatDate(exitDate)})` : `Fully vested ${formatDate(fullyVestedOn(g))}`}
        </span>
      </div>
      {g.notes && <p className="cell-sub pre" style={{ marginTop: 8 }}>{g.notes}</p>}
      {editing && <GrantForm grant={g} employeeId={g.employee_id} onClose={() => setEditing(false)} />}
    </div>
  );
}
