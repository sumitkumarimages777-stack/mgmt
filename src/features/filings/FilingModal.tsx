import { useState } from "react";
import { useFilings } from "../../api";
import { Loading, Modal } from "../../components/ui";
import { FilingDetails } from "./details/FilingDetails";
import { FilingForm } from "./FilingForm";

/** Opens a filing (details, with an Edit mode) — or the add form when `filingId` is null. */
export function FilingModal({ filingId, onClose }: { filingId: string | null; onClose: () => void }) {
  const filings = useFilings();
  const filing = filingId ? filings.data?.find((f) => f.id === filingId) : undefined;
  const [editing, setEditing] = useState(filingId === null);

  if (filingId && !filing) {
    return (
      <Modal title="Filing" onClose={onClose}>
        {filings.isLoading ? <Loading /> : <p>This filing no longer exists.</p>}
      </Modal>
    );
  }
  if (!filing) return <FilingForm onClose={onClose} onSaved={onClose} />;
  if (editing) return <FilingForm filing={filing} onClose={() => setEditing(false)} onSaved={() => setEditing(false)} />;
  return <FilingDetails filing={filing} onClose={onClose} onEdit={() => setEditing(true)} />;
}
