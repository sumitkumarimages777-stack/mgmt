import { Tag } from "../../../components/ui";
import { formatDate } from "../../../lib/dates";
import { formatINR } from "../../../lib/format";
import type { TdsPayment } from "../../../lib/types";

export function TdsTable({ rows, onOpen }: { rows: TdsPayment[]; onOpen: (id: string) => void }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Team member</th>
            <th>Section</th>
            <th>Monthly salary</th>
            <th>TDS</th>
            <th>Status</th>
            <th>Paid on / Challan</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="clickable" onClick={() => onOpen(p.id)}>
              <td>
                <div className="cell-title">{p.employee_name}</div>
                <div className="cell-sub">{p.pan || "No PAN on file"}</div>
              </td>
              <td><Tag>{p.section}</Tag></td>
              <td className="num">{formatINR(p.salary_amount)}</td>
              <td className="num">{formatINR(p.tds_amount)}</td>
              <td>
                <span className={`badge ${p.status === "paid" ? "badge-green" : "badge-amber"}`}>{p.status === "paid" ? "Paid" : "Pending"}</span>
              </td>
              <td>
                {formatDate(p.paid_on)}
                {p.challan_number && <div className="cell-sub">{p.challan_number}</div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
