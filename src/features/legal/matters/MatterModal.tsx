import { useState } from "react";
import { deleteMatter, keys, useDocuments, useWrite } from "../../../api";
import { ErrorBox, Icon, Modal } from "../../../components/ui";
import { formatDate } from "../../../lib/dates";
import type { LegalMatter } from "../../../lib/types";
import { useAuth } from "../../auth/AuthContext";
import { DocumentTable } from "../../documents/DocumentTable";
import { DocumentUploadModal } from "../../documents/DocumentUploadModal";
import { MATTER_TYPE_LABEL } from "../labels";
import { MatterForm } from "./MatterForm";

export function MatterModal({ matter: m, onClose }: { matter: LegalMatter; onClose: () => void }) {
  const { can } = useAuth();
  const documents = useDocuments();
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const remove = useWrite(() => deleteMatter(m.id), [keys.matters]);
  const docs = (documents.data ?? []).filter((d) => d.matter_id === m.id);
  if (editing) return <MatterForm matter={m} onClose={() => setEditing(false)} />;

  const rows: Array<[string, string]> = [
    ["Type", MATTER_TYPE_LABEL[m.matter_type]], ["Counterparty", m.counterparty || "—"], ["Status", m.status === "open" ? "Open" : `Closed ${formatDate(m.closed_on)}`],
    ["Opened", formatDate(m.opened_on)], ["Next date", formatDate(m.next_date)], ["Next action", m.next_action || "—"],
  ];
  const footer = (
    <>
      {can("legal.matters", "manage") && (
        <button className="btn btn-ghost btn-danger" onClick={() => confirm("Delete this matter?") && remove.mutate(undefined, { onSuccess: onClose })}>Delete</button>
      )}
      <span className="spacer" />
      {can("legal.matters", "edit") && <button className="btn" onClick={() => setEditing(true)}>Edit</button>}
    </>
  );

  return (
    <>
      <Modal wide title={m.title} onClose={onClose} footer={footer}>
        <dl className="meta">
          {rows.map(([k, v]) => <div key={k} style={{ display: "contents" }}><dt>{k}</dt><dd>{v}</dd></div>)}
          {m.description && <><dt>Details</dt><dd className="pre">{m.description}</dd></>}
        </dl>
        <div className="section-title">Notices, replies & orders ({docs.length})</div>
        <DocumentTable docs={docs} showSource={false} />
        {can("legal.matters", "edit") && (
          <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => setUploading(true)}><Icon name="plus" size={15} /> Add file</button>
        )}
        <ErrorBox error={remove.error} />
      </Modal>
      {uploading && (
        <DocumentUploadModal defaults={{ module: "legal", feature: "matters", matter_id: m.id, title: m.title, category: "Notice / Order" }} onClose={() => setUploading(false)} />
      )}
    </>
  );
}
