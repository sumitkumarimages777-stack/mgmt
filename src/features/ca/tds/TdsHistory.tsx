import { useMemo } from "react";
import { useTdsPayments } from "../../../api";
import { Empty, ErrorBox, Loading } from "../../../components/ui";
import { formatDate, todayISO } from "../../../lib/dates";
import { formatINR } from "../../../lib/format";
import { monthLabel, tdsDueDate } from "./tdsLogic";

interface MonthSummary {
  month: string;
  people: number;
  total: number;
  pending: number;
  lastPaid: string | null;
}

/** One line per month that has register entries, newest first. */
export function TdsHistory({ onOpen }: { onOpen: (month: string) => void }) {
  const payments = useTdsPayments();
  const months = useMemo(() => {
    const by = new Map<string, MonthSummary>();
    for (const p of payments.data ?? []) {
      const m = by.get(p.month) ?? { month: p.month, people: 0, total: 0, pending: 0, lastPaid: null };
      m.people += 1;
      m.total += Number(p.tds_amount);
      if (p.status === "pending") m.pending += 1;
      if (p.paid_on && (!m.lastPaid || p.paid_on > m.lastPaid)) m.lastPaid = p.paid_on;
      by.set(p.month, m);
    }
    return [...by.values()].sort((a, b) => b.month.localeCompare(a.month));
  }, [payments.data]);
  const today = todayISO();

  if (payments.isLoading) return <div className="card"><Loading /></div>;
  return (
    <div className="card">
      <ErrorBox error={payments.error} />
      {months.length === 0 ? (
        <Empty title="No TDS recorded yet" />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Month</th><th>Due date</th><th>People</th><th>Total TDS</th><th>Status</th><th>Paid on</th></tr>
            </thead>
            <tbody>
              {months.map((m) => {
                const due = tdsDueDate(m.month);
                const badge = m.pending === 0 ? ["badge-green", "All paid"] : due < today ? ["badge-red", `${m.pending} overdue`] : ["badge-amber", `${m.pending} pending`];
                return (
                  <tr key={m.month} className="clickable" onClick={() => onOpen(m.month)}>
                    <td className="cell-title">{monthLabel(m.month)}</td>
                    <td className="nowrap">{formatDate(due)}</td>
                    <td className="num">{m.people}</td>
                    <td className="num">{formatINR(m.total)}</td>
                    <td><span className={`badge ${badge[0]}`}>{badge[1]}</span></td>
                    <td className="nowrap">{formatDate(m.lastPaid)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
