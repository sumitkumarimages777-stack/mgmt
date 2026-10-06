import { useFilings, useLookups } from "../../api";
import { AreaTag, RequestBadge } from "../../components/ui";
import { formatDate } from "../../lib/dates";
import type { DocumentRequest } from "../../lib/types";

export function RequestMeta({ request: r }: { request: DocumentRequest }) {
  const { areaById, personName } = useLookups();
  const filings = useFilings();
  const filing = r.filing_id ? filings.data?.find((f) => f.id === r.filing_id) : undefined;
  return (
    <>
      <dl className="meta">
        <dt>Status</dt>
        <dd><RequestBadge status={r.status} /></dd>
        <dt>Area</dt>
        <dd><AreaTag area={areaById.get(r.area_id)} /></dd>
        <dt>Requested by</dt>
        <dd>{personName(r.requested_by)} on {formatDate(r.created_at)}</dd>
        <dt>Needed by</dt>
        <dd>{formatDate(r.due_date)}</dd>
        {filing && (
          <>
            <dt>For filing</dt>
            <dd>{filing.title}{filing.period ? ` · ${filing.period}` : ""}</dd>
          </>
        )}
        {r.resolved_at && (
          <>
            <dt>Closed on</dt>
            <dd>{formatDate(r.resolved_at)}</dd>
          </>
        )}
      </dl>
      {r.description && <p className="pre" style={{ marginTop: 14 }}>{r.description}</p>}
    </>
  );
}
