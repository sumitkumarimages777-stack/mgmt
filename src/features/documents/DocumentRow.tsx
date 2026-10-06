import { deleteDocument, keys, openDocument, useWrite, type useLookups } from "../../api";
import { AreaTag, Icon } from "../../components/ui";
import { formatDate } from "../../lib/dates";
import { formatBytes } from "../../lib/format";
import type { SharedDocument } from "../../lib/types";
import { useAuth } from "../auth/AuthContext";

interface Props {
  doc: SharedDocument;
  showArea: boolean;
  lookups: ReturnType<typeof useLookups>;
  onError: (e: unknown) => void;
}

export function DocumentRow({ doc, showArea, lookups, onError }: Props) {
  const { profile, isAdmin, canEdit } = useAuth();
  const remove = useWrite((d: SharedDocument) => deleteDocument(d), [keys.documents]);
  const uploader = doc.uploaded_by ? lookups.personById.get(doc.uploaded_by) : undefined;
  const canDelete = isAdmin || (doc.uploaded_by === profile?.id && canEdit(doc.area_id));
  const details = [doc.category, doc.file_name ?? (doc.external_url ? "Link" : null), formatBytes(doc.file_size)];

  const confirmDelete = () => {
    if (confirm(`Delete "${doc.title}"? This cannot be undone.`)) remove.mutate(doc, { onError });
  };

  return (
    <tr>
      <td>
        <div className="cell-title">{doc.title}</div>
        <div className="cell-sub">{details.filter(Boolean).join(" · ")}</div>
        {doc.description && <div className="cell-sub pre">{doc.description}</div>}
      </td>
      {showArea && <td><AreaTag area={lookups.areaById.get(doc.area_id)} /></td>}
      <td>
        {lookups.personName(doc.uploaded_by)}
        {uploader?.organization && <div className="cell-sub">{uploader.organization}</div>}
      </td>
      <td className="nowrap">{formatDate(doc.created_at)}</td>
      <td className="nowrap" style={{ textAlign: "right" }}>
        <button className="btn btn-sm" onClick={() => openDocument(doc).catch(onError)}>
          <Icon name={doc.storage_path ? "download" : "link"} size={15} />
          {doc.storage_path ? "Download" : "Open"}
        </button>
        {canDelete && (
          <button className="btn btn-sm btn-ghost btn-danger" disabled={remove.isPending} onClick={confirmDelete}>
            Delete
          </button>
        )}
      </td>
    </tr>
  );
}
