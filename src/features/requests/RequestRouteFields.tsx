import { SelectField } from "../../components/ui";
import { MODULE_LABEL } from "../../lib/labels";
import type { ModuleKey } from "../../lib/types";
import { useAuth } from "../auth/AuthContext";

// Departments that take requests.
const MODULES: ModuleKey[] = ["ca", "hr", "legal"];

interface Props {
  to: ModuleKey;
  from: ModuleKey | null;
  /** Lock the "To" department (e.g. on a department's own page). */
  lockTo: boolean;
  onChange: (to: ModuleKey, from: ModuleKey | null) => void;
}

/** "To" = department that will handle it; "On behalf of" = department asking (only ones you can act for). */
export function RequestRouteFields({ to, from, lockTo, onChange }: Props) {
  const { can } = useAuth();
  const targets = MODULES.filter((m) => can(`${m}.requests`, "own") || m === to);
  const senders = MODULES.filter((m) => m !== to && can(`${m}.requests`, "edit"));
  return (
    <div className="form-row">
      {lockTo ? (
        <div className="field"><span>To</span><div className="muted">{MODULE_LABEL[to]}</div></div>
      ) : (
        <SelectField
          label="To department"
          value={to}
          onChange={(v) => onChange(v as ModuleKey, from === v ? null : from)}
          options={targets.map((m) => ({ value: m, label: MODULE_LABEL[m] }))}
        />
      )}
      <SelectField
        label="On behalf of"
        allowEmpty
        value={from}
        onChange={(v) => onChange(to, (v || null) as ModuleKey | null)}
        options={senders.map((m) => ({ value: m, label: MODULE_LABEL[m] }))}
      />
    </div>
  );
}
