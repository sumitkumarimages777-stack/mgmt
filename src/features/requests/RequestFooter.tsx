import { Icon } from "../../components/ui";
import type { DocumentRequest, RequestStatus } from "../../lib/types";

interface Props {
  request: DocumentRequest;
  editable: boolean;
  /** Has "manage" on the handling department, or is the person who asked. */
  isOwner: boolean;
  onStatus: (s: RequestStatus) => void;
  onDelete: () => void;
  onEdit: () => void;
  onUpload: () => void;
  onReject: () => void;
}

/** The buttons shown for a request depend on its status and the viewer's rights. */
export function RequestFooter({ request: r, editable, isOwner, onStatus, onDelete, onEdit, onUpload, onReject }: Props) {
  const isOpen = r.status === "open" || r.status === "rejected";
  const isClosed = r.status === "accepted" || r.status === "cancelled";
  return (
    <>
      {isOwner && <button className="btn btn-ghost btn-danger" onClick={onDelete}>Delete</button>}
      <span className="spacer" />
      {editable && isOwner && !isClosed && (
        <button className="btn" onClick={() => onStatus("cancelled")}>Cancel request</button>
      )}
      {editable && <button className="btn" onClick={onEdit}>Edit</button>}
      {editable && r.status === "submitted" && (
        <>
          <button className="btn" onClick={onReject}>Ask for changes</button>
          <button className="btn btn-primary" onClick={() => onStatus("accepted")}>Accept</button>
        </>
      )}
      {editable && isOpen && (
        <button className="btn btn-primary" onClick={onUpload}>
          <Icon name="plus" size={16} /> Add file
        </button>
      )}
      {editable && isClosed && <button className="btn" onClick={() => onStatus("open")}>Re-open</button>}
    </>
  );
}
