import { deleteDocument, keys, openDocument, useWrite, type useLookups } from "../../api";
import { Icon, Tag } from "../../components/ui";
import { formatDate } from "../../lib/dates";
import { formatBytes } from "../../lib/format";
import type { SharedDocument } from "../../lib/types";
import type { ExtraColumn } from "./DocumentTable";
import { useAuth } from "../auth/AuthContext";

interface Props {
  doc: SharedDocument;
  showSource: boolean;
  extra?: ExtraColumn;
  lookups: ReturnType<typeof useLookups>;
  onError: (e: unknown) => void;
}

const SOURCE_LABEL: Record<string, string> = { requests: "Document request", filings: "Filing", documents: "Record" };

export function DocumentRow({ doc, showSource, extra, lookups, onError }: Props) {
  const { profile, can } = useAuth();
  const remove = useWrite((d: SharedDocument) => deleteDocument(d), [keys.documents]);
  const uploader = doc.uploaded_by ? lookups.personById.get(doc.uploaded_by) : undefined;
  const canDelete = can(doc.perm_key, "manage") || (doc.uploaded_by === profile?.id && can(doc.perm_key, "edit"));
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
      {extra && <td>{extra.render(doc)}</td>}
      {showSource && <td><Tag>{SOURCE_LABEL[doc.feature] ?? doc.feature}</Tag></td>}
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
