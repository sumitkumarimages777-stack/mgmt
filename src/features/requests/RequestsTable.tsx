import { useDocuments, useLookups } from "../../api";
import { RequestBadge } from "../../components/ui";
import { daysBetween, formatDate, todayISO } from "../../lib/dates";
import type { DocumentRequest } from "../../lib/types";
import { RouteTag } from "./RouteTag";

const oneLine = { maxWidth: 420, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as const;

interface Props {
  rows: DocumentRequest[];
  /** Show which department asked and which handles it. */
  showRoute: boolean;
  onOpen: (id: string) => void;
}

export function RequestsTable({ rows, showRoute, onOpen }: Props) {
  const documents = useDocuments();
  const { personName, personById } = useLookups();
  const today = todayISO();
  const docCount = (id: string) => (documents.data ?? []).filter((d) => d.request_id === id).length;
  const isLate = (r: DocumentRequest) =>
    !!r.due_date && (r.status === "open" || r.status === "rejected") && daysBetween(today, r.due_date) < 0;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Request</th>
            {showRoute && <th>From → To</th>}
            <th>Asked by</th>
            <th>Needed by</th>
            <th>Status</th>
            <th>Files</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="clickable" onClick={() => onOpen(r.id)}>
              <td>
                <div className="cell-title">{r.title}</div>
                {r.description && <div className="cell-sub" style={oneLine}>{r.description}</div>}
              </td>
              {showRoute && <td><RouteTag request={r} /></td>}
              <td>
                {personName(r.requested_by)}
                <div className="cell-sub">
                  {r.requested_by ? personById.get(r.requested_by)?.organization ?? "" : ""} {formatDate(r.created_at)}
                </div>
              </td>
              <td className="nowrap" style={isLate(r) ? { color: "var(--red)" } : undefined}>{formatDate(r.due_date)}</td>
              <td><RequestBadge status={r.status} /></td>
              <td className="num">{docCount(r.id) || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
