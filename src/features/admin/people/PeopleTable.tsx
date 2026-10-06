import type { Profile, Role } from "../../../lib/types";

interface Props {
  people: Profile[];
  rolesOf: (userId: string) => Role[];
  onOpen: (p: Profile) => void;
}

export function PeopleTable({ people, rolesOf, onOpen }: Props) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Person</th>
            <th>Roles</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {people.map((p) => {
            const roles = rolesOf(p.id);
            return (
              <tr key={p.id} className="clickable" onClick={() => onOpen(p)}>
                <td>
                  <div className="cell-title">{p.full_name || "—"}</div>
                  <div className="cell-sub">{p.email}{p.organization ? ` · ${p.organization}` : ""}</div>
                </td>
                <td>
                  {roles.length === 0 ? (
                    <span className="badge badge-amber">No role yet</span>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {roles.map((r) => <span key={r.id} className="badge badge-gray">{r.name}</span>)}
                    </div>
                  )}
                </td>
                <td>
                  {p.is_active ? <span className="badge badge-green">Active</span> : <span className="badge badge-gray">Deactivated</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
