import { useState } from "react";
import { useAreaMembers, useAreas } from "../../../api";
import { Empty, Icon, Loading } from "../../../components/ui";
import type { Area } from "../../../lib/types";
import { AreaModal } from "./AreaModal";

export function AreasPage() {
  const areas = useAreas();
  const members = useAreaMembers();
  const [editing, setEditing] = useState<Area | "new" | null>(null);
  const memberCount = (areaId: string) => (members.data ?? []).filter((m) => m.area_id === areaId).length;

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
              const n = memberCount(a.id);
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
