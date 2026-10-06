import { useNavigate } from "react-router-dom";
import { formatDate, todayISO } from "../../../lib/dates";
import { formatCount } from "../../../lib/format";
import type { EsopGrant } from "../../../lib/types";
import { useEmployeeLookup } from "../useEmployeeLookup";
import { nextVesting, vestedOptions } from "./vesting";

export function GrantsTable({ grants, exitOf }: { grants: EsopGrant[]; exitOf: (employeeId: string) => string | null }) {
  const navigate = useNavigate();
  const { employeeName } = useEmployeeLookup();
  const today = todayISO();
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Team member</th><th>Granted</th><th>Options</th><th>Vested</th><th>Next vesting</th><th>Status</th></tr>
        </thead>
        <tbody>
          {grants.map((g) => {
            const exit = exitOf(g.employee_id);
            const vested = vestedOptions(g, today, exit);
            const next = nextVesting(g, today, exit);
            return (
              <tr key={g.id} className="clickable" onClick={() => navigate(`/hr/team/${g.employee_id}`)}>
                <td className="cell-title">{employeeName(g.employee_id)}</td>
                <td className="nowrap">{formatDate(g.grant_date)}</td>
                <td className="num">{formatCount(g.options)}</td>
                <td className="num">{formatCount(vested)} <span className="faint">({Math.round((vested / g.options) * 100)}%)</span></td>
                <td className="nowrap">{next ? `${formatCount(next.vested - vested)} on ${formatDate(next.date)}` : "—"}</td>
                <td>{g.status === "cancelled" ? <span className="badge badge-gray">Cancelled</span> : <span className="badge badge-green">Active</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
