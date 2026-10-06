import type { GrantMap } from "../../../api";
import { ACCESS_LEVELS } from "../../../lib/access";
import { ACCESS_HELP, ACCESS_LABEL, MODULE_LABEL } from "../../../lib/labels";
import type { AccessLevel, ModuleKey, PermissionDef } from "../../../lib/types";

type SetLevel = (key: string, level: AccessLevel | undefined) => void;

function LevelSwitch({ perm, value, onSet }: { perm: PermissionDef; value: AccessLevel | undefined; onSet: SetLevel }) {
  const levels = ACCESS_LEVELS.filter((l) => l !== "own" || perm.supports_own);
  return (
    <div className="seg">
      <button type="button" className={!value ? "on" : ""} title={ACCESS_HELP.none} onClick={() => onSet(perm.key, undefined)}>
        None
      </button>
      {levels.map((l) => (
        <button key={l} type="button" className={value === l ? "on" : ""} title={ACCESS_HELP[l]} onClick={() => onSet(perm.key, l)}>
          {ACCESS_LABEL[l]}
        </button>
      ))}
    </div>
  );
}

function ModuleRows({ module, perms, value, onSet }: { module: ModuleKey; perms: PermissionDef[]; value: GrantMap; onSet: SetLevel }) {
  return (
    <>
      <tr>
        <th colSpan={2}>{MODULE_LABEL[module]}</th>
      </tr>
      {perms.map((p) => (
        <tr key={p.key}>
          <td>
            <div className="cell-title">{p.label}</div>
            {p.description && <div className="cell-sub">{p.description}</div>}
          </td>
          <td style={{ textAlign: "right" }}>
            <LevelSwitch perm={p} value={value[p.key]} onSet={onSet} />
          </td>
        </tr>
      ))}
    </>
  );
}

/** Module-by-module grid: one row per feature with a None / Own / View / Edit / Manage switch. */
export function PermissionGrid({ catalog, value, onChange }: { catalog: PermissionDef[]; value: GrantMap; onChange: (v: GrantMap) => void }) {
  const modules = [...new Set(catalog.map((p) => p.module))];
  const set: SetLevel = (key, level) => {
    const next = { ...value };
    if (level) next[key] = level;
    else delete next[key];
    onChange(next);
  };
  return (
    <table className="access-grid card">
      <tbody>
        {modules.map((m) => (
          <ModuleRows key={m} module={m} perms={catalog.filter((p) => p.module === m)} value={value} onSet={set} />
        ))}
      </tbody>
    </table>
  );
}
