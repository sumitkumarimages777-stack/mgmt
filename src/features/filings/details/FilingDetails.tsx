import { deleteFiling, keys, useWrite } from "../../../api";
import { Modal } from "../../../components/ui";
import type { Filing } from "../../../lib/types";
import { useAuth } from "../../auth/AuthContext";
import { Comments } from "../../comments/Comments";
import { FilingAttachments } from "./FilingAttachments";
import { FilingMeta } from "./FilingMeta";
import { FilingStatusActions } from "./FilingStatusActions";

interface Props {
  filing: Filing;
  onClose: () => void;
  onEdit: () => void;
}

export function FilingDetails({ filing, onClose, onEdit }: Props) {
  const { canEdit, isAdmin } = useAuth();
  const editable = canEdit(filing.area_id);
  const remove = useWrite(() => deleteFiling(filing.id), [keys.filings]);

  const footer = (
    <>
      {isAdmin && (
        <button
          className="btn btn-ghost btn-danger"
          disabled={remove.isPending}
          onClick={() => confirm("Delete this filing?") && remove.mutate(undefined, { onSuccess: onClose })}
        >
          Delete
        </button>
      )}
      <span className="spacer" />
      {editable && <button className="btn" onClick={onEdit}>Edit</button>}
    </>
  );

  return (
    <Modal
      wide
      title={<>{filing.title}{filing.period && <span className="muted"> · {filing.period}</span>}</>}
      onClose={onClose}
      footer={footer}
    >
      <FilingMeta filing={filing} />
      {editable && <FilingStatusActions filing={filing} />}
      <FilingAttachments filing={filing} editable={editable} />
      <div className="section-title">Discussion</div>
      <Comments kind="filing" parentId={filing.id} />
    </Modal>
  );
}
