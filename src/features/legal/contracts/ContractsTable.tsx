import { formatDate, todayISO } from "../../../lib/dates";
import { formatINR } from "../../../lib/format";
import type { Contract } from "../../../lib/types";
import { ContractAlertBadge } from "./ContractAlertBadge";

export function ContractsTable({ rows, onOpen }: { rows: Contract[]; onOpen: (c: Contract) => void }) {
  const today = todayISO();
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Contract</th><th>Counterparty</th><th>Start</th><th>End</th><th>Value</th><th>Status</th></tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} className="clickable" onClick={() => onOpen(c)}>
              <td>
                <div className="cell-title">{c.title}</div>
                <div className="cell-sub">{c.contract_type}</div>
              </td>
              <td>{c.counterparty || "—"}</td>
              <td className="nowrap">{formatDate(c.start_date)}</td>
              <td className="nowrap">{formatDate(c.end_date)}</td>
              <td className="num">{c.value ? formatINR(c.value) : "—"}</td>
              <td><ContractAlertBadge contract={c} today={today} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
