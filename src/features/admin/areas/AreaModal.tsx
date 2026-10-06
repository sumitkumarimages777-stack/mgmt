import { useState } from "react";
import { deleteArea, keys, saveArea, useWrite } from "../../../api";
import { ErrorBox, Modal } from "../../../components/ui";
import type { Area } from "../../../lib/types";
import { ColorPicker } from "./ColorPicker";
import { AREA_COLORS } from "./colors";

export function AreaModal({ area, onClose }: { area?: Area; onClose: () => void }) {
  const [name, setName] = useState(area?.name ?? "");
  const [description, setDescription] = useState(area?.description ?? "");
  const [color, setColor] = useState(area?.color ?? AREA_COLORS[0]);
  const save = useWrite(
    () => saveArea(area?.id ?? null, { name: name.trim(), description: description.trim() || null, color }),
    [keys.areas],
  );
  const remove = useWrite(() => deleteArea(area!.id), [keys.areas, keys.members]);

  const footer = (
    <>
      {area && (
        <button
          className="btn btn-ghost btn-danger"
          onClick={() => confirm(`Delete area "${area.name}"?`) && remove.mutate(undefined, { onSuccess: onClose })}
        >
          Delete
        </button>
      )}
      <span className="spacer" />
      <button className="btn" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" disabled={!name.trim() || save.isPending} onClick={() => save.mutate(undefined, { onSuccess: onClose })}>
        Save
      </button>
    </>
  );

  return (
    <Modal title={area ? "Edit area" : "New area"} onClose={onClose} footer={footer}>
      <div className="form">
        <label className="field">
          <span>Name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Trademark & IP" />
        </label>
        <label className="field">
          <span>Description</span>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <div className="field">
          <span>Colour</span>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <ErrorBox error={save.error ?? remove.error} />
      </div>
    </Modal>
  );
}
