import { useState } from "react";
import { useDocuments, useRequests } from "../../api";
import { ErrorBox, Loading, Modal } from "../../components/ui";
import { useAuth } from "../auth/AuthContext";
import { Comments } from "../comments/Comments";
import { DocumentTable } from "../documents/DocumentTable";
import { DocumentUploadModal } from "../documents/DocumentUploadModal";
import { RejectForm } from "./RejectForm";
import { RequestFooter } from "./RequestFooter";
import { RequestForm } from "./RequestForm";
import { RequestMeta } from "./RequestMeta";
import { useRequestActions } from "./useRequestActions";

export function RequestModal({ requestId, onClose }: { requestId: string; onClose: () => void }) {
  const { profile, isAdmin, canEdit } = useAuth();
  const requests = useRequests();
  const documents = useDocuments();
  const { setStatus, remove } = useRequestActions(requestId);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const r = requests.data?.find((x) => x.id === requestId);
  if (!r) {
    return (
      <Modal title="Request" onClose={onClose}>
        {requests.isLoading ? <Loading /> : <p>This request no longer exists.</p>}
      </Modal>
    );
  }
  if (editing) return <RequestForm request={r} onClose={() => setEditing(false)} />;

  const editable = canEdit(r.area_id);
  const isOwner = isAdmin || (r.requested_by === profile?.id && editable);
  const docs = (documents.data ?? []).filter((d) => d.request_id === r.id);

  const footer = (
    <RequestFooter
      request={r}
      editable={editable}
      isOwner={isOwner}
      onStatus={(status) => setStatus.mutate({ status })}
      onDelete={() => confirm("Delete this request?") && remove.mutate(undefined, { onSuccess: onClose })}
      onEdit={() => setEditing(true)}
      onUpload={() => setUploading(true)}
      onReject={() => setRejecting(true)}
    />
  );

  return (
    <>
      <Modal wide title={r.title} onClose={onClose} footer={footer}>
        <RequestMeta request={r} />
        {rejecting && (
          <RejectForm
            busy={setStatus.isPending}
            onCancel={() => setRejecting(false)}
            onSend={(reason) =>
              setStatus.mutate(
                { status: "rejected", note: `Re-upload needed: ${reason}` },
                { onSuccess: () => setRejecting(false) },
              )
            }
          />
        )}
        <ErrorBox error={setStatus.error ?? remove.error} />

        <div className="section-title">Documents sent ({docs.length})</div>
        <DocumentTable docs={docs} showArea={false} />

        <div className="section-title">Discussion</div>
        <Comments kind="request" parentId={r.id} />
      </Modal>
      {uploading && (
        <DocumentUploadModal
          lockArea
          defaults={{ area_id: r.area_id, request_id: r.id, filing_id: r.filing_id, title: r.title }}
          onClose={() => setUploading(false)}
        />
      )}
    </>
  );
}
