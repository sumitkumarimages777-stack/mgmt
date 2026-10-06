import type { Role } from "../../../lib/types";

interface Props {
  roles: Role[];
  value: string[];
  onChange: (ids: string[]) => void;
  /** Role ids that can't be unticked here (e.g. your own Admin role). */
  locked?: string[];
}

/** Tick any number of roles; access is the highest level across them. */
export function RolePicker({ roles, value, onChange, locked = [] }: Props) {
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((r) => r !== id) : [...value, id]);
  return (
    <div className="field">
      <span>Roles</span>
      <div className="card card-pad" style={{ display: "grid", gap: 10 }}>
        {roles.map((r) => (
          <label key={r.id} className="check">
            <input type="checkbox" checked={value.includes(r.id)} disabled={locked.includes(r.id)} onChange={() => toggle(r.id)} />
            <span>
              <strong>{r.name}</strong>
              {r.description && <div className="faint small">{r.description}</div>}
            </span>
          </label>
        ))}
      </div>
      <small>Need a new combination of permissions? Create a role under Roles &amp; permissions.</small>
    </div>
  );
}
