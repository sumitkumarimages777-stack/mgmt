import { useLookups } from "../../api";
import { AreaTag, DueText, FilingBadge } from "../../components/ui";
import { formatDate } from "../../lib/dates";
import type { Filing } from "../../lib/types";

interface Props {
  rows: Filing[];
  /** Show filed date / ack no. instead of assignee. */
  showFiled: boolean;
  onOpen: (id: string) => void;
}

export function FilingsTable({ rows, showFiled, onOpen }: Props) {
  const { areaById, personName } = useLookups();
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Due date</th>
            <th>Filing</th>
            <th>Period</th>
            <th>Area</th>
            <th>Status</th>
            <th>{showFiled ? "Filed on / Ack no." : "Assigned to"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.id} className="clickable" onClick={() => onOpen(f.id)}>
              <td className="nowrap num">
                {formatDate(f.due_date)}
                <DueText filing={f} />
              </td>
              <td>
                <div className="cell-title">{f.title}</div>
                {f.form_code && f.form_code !== f.title && <div className="cell-sub">{f.form_code}</div>}
              </td>
              <td className="nowrap">{f.period || "—"}</td>
              <td><AreaTag area={areaById.get(f.area_id)} /></td>
              <td><FilingBadge filing={f} /></td>
              <td>
                {showFiled ? (
                  <>
                    {formatDate(f.filed_on)}
                    {f.ack_number && <div className="cell-sub">{f.ack_number}</div>}
                  </>
                ) : (
                  personName(f.assignee_id)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
