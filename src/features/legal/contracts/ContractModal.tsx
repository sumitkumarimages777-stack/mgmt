import { useState } from "react";
import { deleteContract, keys, useDocuments, useLookups, useWrite } from "../../../api";
import { ErrorBox, Icon, Modal } from "../../../components/ui";
import { formatDate, todayISO } from "../../../lib/dates";
import { formatINR } from "../../../lib/format";
import type { Contract } from "../../../lib/types";
import { useAuth } from "../../auth/AuthContext";
import { DocumentTable } from "../../documents/DocumentTable";
import { DocumentUploadModal } from "../../documents/DocumentUploadModal";
import { ContractAlertBadge } from "./ContractAlertBadge";
import { noticeDeadline } from "./contractAlerts";
import { ContractForm } from "./ContractForm";

export function ContractModal({ contract: c, onClose }: { contract: Contract; onClose: () => void }) {
  const { can } = useAuth();
  const { personName } = useLookups();
  const documents = useDocuments();
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const remove = useWrite(() => deleteContract(c.id), [keys.contracts]);
  const docs = (documents.data ?? []).filter((d) => d.contract_id === c.id);
  if (editing) return <ContractForm contract={c} onClose={() => setEditing(false)} />;

  const rows: Array<[string, string]> = [
    ["Type", c.contract_type], ["Counterparty", c.counterparty || "—"], ["Start", formatDate(c.start_date)],
    ["End / expiry", formatDate(c.end_date)], ["Renewal notice by", formatDate(noticeDeadline(c))],
    ["Value", c.value ? formatINR(c.value) : "—"], ["Owner", personName(c.owner_id)],
  ];
  const footer = (
    <>
      {can("legal.contracts", "manage") && (
        <button className="btn btn-ghost btn-danger" onClick={() => confirm("Delete this contract?") && remove.mutate(undefined, { onSuccess: onClose })}>Delete</button>
      )}
      <span className="spacer" />
      {can("legal.contracts", "edit") && <button className="btn" onClick={() => setEditing(true)}>Edit</button>}
    </>
  );

  return (
    <>
      <Modal wide title={c.title} onClose={onClose} footer={footer}>
        <div style={{ marginBottom: 12 }}><ContractAlertBadge contract={c} today={todayISO()} /></div>
        <dl className="meta">
          {rows.map(([k, v]) => <div key={k} style={{ display: "contents" }}><dt>{k}</dt><dd>{v}</dd></div>)}
          {c.notes && <><dt>Notes</dt><dd className="pre">{c.notes}</dd></>}
        </dl>
        <div className="section-title">Signed copies & drafts ({docs.length})</div>
        <DocumentTable docs={docs} showSource={false} />
        {can("legal.contracts", "edit") && (
          <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => setUploading(true)}><Icon name="plus" size={15} /> Add file</button>
        )}
        <ErrorBox error={remove.error} />
      </Modal>
      {uploading && (
        <DocumentUploadModal defaults={{ module: "legal", feature: "contracts", contract_id: c.id, title: c.title, category: "Agreement / Contract" }} onClose={() => setUploading(false)} />
      )}
    </>
  );
}
