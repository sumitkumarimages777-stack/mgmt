import { useLookups } from "../../../api";
import { DueText, FilingBadge, Tag } from "../../../components/ui";
import { formatDate } from "../../../lib/dates";
import type { Filing } from "../../../lib/types";
import type { RowSelection } from "./useRowSelection";

interface Props {
  rows: Filing[];
  /** Show filed date / ack no. instead of assignee. */
  showFiled: boolean;
  onOpen: (id: string) => void;
  /** Adds a checkbox column when given (people who can delete filings). */
  selection?: RowSelection;
}

export function FilingsTable({ rows, showFiled, onOpen, selection }: Props) {
  const { personName } = useLookups();
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {selection && (
              <th className="select-col">
                <input type="checkbox" aria-label="Select all" checked={selection.allSelected} onChange={selection.toggleAll} />
              </th>
            )}
            <th>Due date</th>
            <th>Filing</th>
            <th>Period</th>
            <th>Category</th>
            <th>Status</th>
            <th>{showFiled ? "Filed on / Ack no." : "Assigned to"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.id} className="clickable" onClick={() => onOpen(f.id)}>
              {selection && (
                <td className="select-col" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    aria-label={`Select ${f.title}`}
                    checked={selection.isSelected(f.id)}
                    onChange={() => selection.toggle(f.id)}
                  />
                </td>
              )}
              <td className="nowrap num">
                {formatDate(f.due_date)}
                <DueText filing={f} />
              </td>
              <td>
                <div className="cell-title">{f.title}</div>
                {f.form_code && f.form_code !== f.title && <div className="cell-sub">{f.form_code}</div>}
              </td>
              <td className="nowrap">{f.period || "—"}</td>
              <td><Tag>{f.category}</Tag></td>
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
