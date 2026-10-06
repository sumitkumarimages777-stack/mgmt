import { daysBetween, formatDate, relativeDue, todayISO } from "../../../lib/dates";
import type { LegalMatter } from "../../../lib/types";
import { MATTER_TYPE_LABEL } from "../labels";

export function MattersTable({ rows, onOpen }: { rows: LegalMatter[]; onOpen: (id: string) => void }) {
  const today = todayISO();
  const soon = (m: LegalMatter) => m.status === "open" && !!m.next_date && daysBetween(today, m.next_date) <= 7;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Matter</th><th>Type</th><th>Counterparty</th><th>Next date</th><th>Status</th></tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.id} className="clickable" onClick={() => onOpen(m.id)}>
              <td>
                <div className="cell-title">{m.title}</div>
                {m.next_action && <div className="cell-sub">Next: {m.next_action}</div>}
              </td>
              <td className="nowrap">{MATTER_TYPE_LABEL[m.matter_type]}</td>
              <td>{m.counterparty || "—"}</td>
              <td className="nowrap" style={soon(m) ? { color: "var(--red)" } : undefined}>
                {formatDate(m.next_date)}
                {m.status === "open" && m.next_date && <div className="cell-sub">{relativeDue(m.next_date, today)}</div>}
              </td>
              <td><span className={`badge ${m.status === "open" ? "badge-amber" : "badge-gray"}`}>{m.status === "open" ? "Open" : "Closed"}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
