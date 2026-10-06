import { useState } from "react";
import { useDocuments, useRequests } from "../../../../api";
import { Icon, RequestBadge } from "../../../../components/ui";
import type { Filing } from "../../../../lib/types";
import { useAuth } from "../../../auth/AuthContext";
import { DocumentTable } from "../../../documents/DocumentTable";
import { DocumentUploadModal } from "../../../documents/DocumentUploadModal";
import { RequestModal } from "../../requests/RequestModal";

/** Documents attached to a filing and document requests linked to it. */
export function FilingAttachments({ filing, editable }: { filing: Filing; editable: boolean }) {
  const { can } = useAuth();
  const requests = useRequests(can("ca.requests"));
  const documents = useDocuments();
  const [uploading, setUploading] = useState(false);
  const [openRequest, setOpenRequest] = useState<string | null>(null);
  const linkedRequests = (requests.data ?? []).filter((r) => r.filing_id === filing.id);
  const linkedDocs = (documents.data ?? []).filter((d) => d.filing_id === filing.id);

  return (
    <>
      <div className="section-title">Documents ({linkedDocs.length})</div>
      <DocumentTable docs={linkedDocs} showSource={false} />
      {editable && (
        <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => setUploading(true)}>
          <Icon name="plus" size={15} /> Attach document (e.g. acknowledgement, challan)
        </button>
      )}

      {linkedRequests.length > 0 && (
        <>
          <div className="section-title">Document requests ({linkedRequests.length})</div>
          <ul className="list card">
            {linkedRequests.map((r) => (
              <li key={r.id} className="list-item clickable" onClick={() => setOpenRequest(r.id)}>
                <div className="grow">{r.title}</div>
                <RequestBadge status={r.status} />
              </li>
            ))}
          </ul>
        </>
      )}

      {uploading && (
        <DocumentUploadModal
          defaults={{
            module: "ca",
            feature: "filings",
            filing_id: filing.id,
            category: "Acknowledgement",
            title: `${filing.title} ${filing.period}`.trim(),
          }}
          onClose={() => setUploading(false)}
        />
      )}
      {openRequest && <RequestModal requestId={openRequest} onClose={() => setOpenRequest(null)} />}
    </>
  );
}
