import { ROLE_LABEL } from "../../../lib/labels";
import type { UserRole } from "../../../lib/types";

const ROLE_HELP: Record<UserRole, string> = {
  admin: "Full access to everything, including people & areas.",
  staff: "Your own team. Sees only the areas you tick below.",
  external: "CA, lawyer or other outside advisor. Sees only the areas you tick below.",
};

export function RoleField({ value, onChange, locked }: { value: UserRole; onChange: (r: UserRole) => void; locked?: boolean }) {
  return (
    <label className="field">
      <span>Role</span>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value as UserRole)} disabled={locked}>
        {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
      </select>
      <small>{locked ? "You can't change your own role." : ROLE_HELP[value]}</small>
    </label>
  );
}
