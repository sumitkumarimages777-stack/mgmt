import { useSalarySnapshot } from "../../../api";
import { Empty, ErrorBox, Loading, Tag } from "../../../components/ui";
import { todayISO } from "../../../lib/dates";
import { formatINR } from "../../../lib/format";
import type { TdsRule } from "../../../lib/types";
import { eligibleForTds, monthOf, monthLabel } from "../tds/tdsLogic";

/** Who the rules pick up this month, from the salaries recorded in HR. */
export function EligibleNow({ rules }: { rules: TdsRule[] }) {
  const month = monthOf(todayISO());
  const snapshot = useSalarySnapshot(month);
  const eligible = eligibleForTds(snapshot.data ?? [], rules);
  const withSalary = snapshot.data?.length ?? 0;

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-head">
        <h2>Eligible in {monthLabel(month)}</h2>
        <span className="muted small">{eligible.length} of {withSalary} team members with a salary on file</span>
      </div>
      <ErrorBox error={snapshot.error} />
      {snapshot.isLoading ? (
        <Loading />
      ) : eligible.length === 0 ? (
        <Empty title="Nobody matches the rules this month">Team members without a salary in HR aren't counted.</Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Team member</th><th>Section</th><th>Annual CTC</th><th>Monthly gross</th><th>Rule</th></tr>
            </thead>
            <tbody>
              {eligible.map(({ person, rule }) => (
                <tr key={`${person.employee_id}-${rule.section}`}>
                  <td>
                    <div className="cell-title">{person.full_name}</div>
                    <div className="cell-sub">{person.pan || "No PAN on file"}</div>
                  </td>
                  <td><Tag>{rule.section}</Tag></td>
                  <td className="num">{formatINR(person.annual_ctc)}</td>
                  <td className="num">{formatINR(person.monthly_gross)}</td>
                  <td>{rule.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
