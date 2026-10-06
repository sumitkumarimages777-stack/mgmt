import { useLookups } from "../../../api";
import { AreaTag, DueText, FilingBadge } from "../../../components/ui";
import { formatDate } from "../../../lib/dates";
import type { Filing } from "../../../lib/types";

export function FilingMeta({ filing }: { filing: Filing }) {
  const { areaById, personName } = useLookups();
  return (
    <dl className="meta">
      <dt>Status</dt>
      <dd><FilingBadge filing={filing} /> <DueText filing={filing} /></dd>
      <dt>Due date</dt>
      <dd>{formatDate(filing.due_date)}</dd>
      <dt>Form</dt>
      <dd>{filing.form_code || "—"}</dd>
      <dt>Area</dt>
      <dd><AreaTag area={areaById.get(filing.area_id)} /></dd>
      <dt>Assigned to</dt>
      <dd>{personName(filing.assignee_id)}</dd>
      {filing.status === "filed" && (
        <>
          <dt>Filed on</dt>
          <dd>{formatDate(filing.filed_on)}</dd>
          <dt>Acknowledgement</dt>
          <dd>{filing.ack_number || "—"}</dd>
        </>
      )}
      {filing.notes && (
        <>
          <dt>Notes</dt>
          <dd className="pre">{filing.notes}</dd>
        </>
      )}
    </dl>
  );
}
