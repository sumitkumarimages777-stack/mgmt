import { useLookups } from "../../../api";
import { AreaTag } from "../../../components/ui";
import { ROLE_LABEL } from "../../../lib/labels";
import type { AreaMember, Profile } from "../../../lib/types";

function AccessSummary({ person, members }: { person: Profile; members: AreaMember[] }) {
  const { areaById } = useLookups();
  if (person.role === "admin") return <span className="muted">All areas</span>;
  if (members.length === 0) return <span className="badge badge-amber">No access yet</span>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
      {members.map((m) => (
        <span key={m.area_id} className="nowrap">
          <AreaTag area={areaById.get(m.area_id)} />
          <span className="faint small"> ({m.permission})</span>
        </span>
      ))}
    </div>
  );
}

interface Props {
  people: Profile[];
  members: AreaMember[];
  onOpen: (p: Profile) => void;
}

export function PeopleTable({ people, members, onOpen }: Props) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Person</th>
            <th>Role</th>
            <th>Access</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {people.map((p) => (
            <tr key={p.id} className="clickable" onClick={() => onOpen(p)}>
              <td>
                <div className="cell-title">{p.full_name || "—"}</div>
                <div className="cell-sub">{p.email}{p.organization ? ` · ${p.organization}` : ""}</div>
              </td>
              <td className="nowrap">{ROLE_LABEL[p.role]}</td>
              <td><AccessSummary person={p} members={members.filter((m) => m.user_id === p.id)} /></td>
              <td>
                {p.is_active ? <span className="badge badge-green">Active</span> : <span className="badge badge-gray">Deactivated</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
