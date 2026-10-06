import { useState } from "react";
import { keys, returnAsset, useWrite } from "../../../api";
import { ErrorBox, Modal, TextField } from "../../../components/ui";
import { todayISO } from "../../../lib/dates";
import type { AssetAssignment } from "../../../lib/types";

export function ReturnAssetModal({ assignment, onClose }: { assignment: AssetAssignment; onClose: () => void }) {
  const [returnedOn, setReturnedOn] = useState(todayISO());
  const [condition, setCondition] = useState("");
  const save = useWrite(() => returnAsset(assignment.id, returnedOn, condition.trim() || null), [keys.assets, keys.assignments]);

  const footer = (
    <>
      <button className="btn" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" disabled={!returnedOn || save.isPending} onClick={() => save.mutate(undefined, { onSuccess: onClose })}>
        Mark returned
      </button>
    </>
  );

  return (
    <Modal title="Equipment returned" onClose={onClose} footer={footer}>
      <div className="form">
        <TextField label="Returned on" type="date" value={returnedOn} onChange={setReturnedOn} />
        <TextField label="Condition on return" value={condition} onChange={setCondition} placeholder="e.g. Good, screen scratched" />
        <ErrorBox error={save.error} />
      </div>
    </Modal>
  );
}
