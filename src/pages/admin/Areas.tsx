import { useState } from "react";
import { Empty, ErrorBox, Icon, Loading, Modal } from "../../components/ui";
import { keys, useAreaMembers, useAreas, useWrite } from "../../lib/api";
import { supabase } from "../../lib/supabase";
import type { Area } from "../../lib/types";

const COLORS = ["#2563eb", "#7c3aed", "#0891b2", "#b45309", "#16a34a", "#db2777", "#dc2626", "#475569"];

export function AreasPage() {
  const areas = useAreas();
  const members = useAreaMembers();
  const [editing, setEditing] = useState<Area | "new" | null>(null);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Areas</h1>
          <p>
            Areas group your work — e.g. “Accounts & Tax” for the CA, “Legal” for the lawyer. Each person only sees the
            areas you give them access to.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing("new")}>
          <Icon name="plus" size={16} /> New area
        </button>
      </div>
      <div className="card">
        {areas.isLoading ? (
          <Loading />
        ) : (areas.data ?? []).length === 0 ? (
          <Empty title="No areas yet" />
        ) : (
          <ul className="list">
            {(areas.data ?? []).map((a) => {
              const n = (members.data ?? []).filter((m) => m.area_id === a.id).length;
              return (
                <li key={a.id} className="list-item clickable" onClick={() => setEditing(a)}>
                  <span className="area-dot" style={{ background: a.color, width: 12, height: 12, marginTop: 4 }} />
                  <div className="grow">
                    <div className="cell-title">{a.name}</div>
                    <div className="cell-sub">{a.description}</div>
                  </div>
                  <span className="muted small nowrap">{n} {n === 1 ? "person" : "people"} with access</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {editing && <AreaModal area={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function AreaModal({ area, onClose }: { area?: Area; onClose: () => void }) {
  const [name, setName] = useState(area?.name ?? "");
  const [description, setDescription] = useState(area?.description ?? "");
  const [color, setColor] = useState(area?.color ?? COLORS[0]);

  const save = useWrite(async () => {
    const row = { name: name.trim(), description: description.trim() || null, color };
    const { error } = area
      ? await supabase.from("areas").update(row).eq("id", area.id)
      : await supabase.from("areas").insert(row);
    if (error) throw error;
  }, [keys.areas]);

  const remove = useWrite(async () => {
    const { error } = await supabase.from("areas").delete().eq("id", area!.id);
    if (error) {
      if (error.code === "23503") throw new Error("This area still has filings, requests or documents. Move or delete them first.");
      throw error;
    }
  }, [keys.areas, keys.members]);

  return (
    <Modal
      title={area ? "Edit area" : "New area"}
      onClose={onClose}
      footer={
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
      }
    >
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
          <div className="actions">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => setColor(c)}
                style={{
                  width: 26, height: 26, borderRadius: 99, background: c, cursor: "pointer",
                  border: color === c ? "3px solid var(--text)" : "2px solid var(--surface)",
                }}
              />
            ))}
          </div>
        </div>
        <ErrorBox error={save.error ?? remove.error} />
      </div>
    </Modal>
  );
}
