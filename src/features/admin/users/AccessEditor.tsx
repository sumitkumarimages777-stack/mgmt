import type { AccessMap } from "../../../api";
import { AreaTag } from "../../../components/ui";
import type { Area } from "../../../lib/types";

const OPTIONS = [
  ["none", "No access"],
  ["view", "View"],
  ["edit", "Edit"],
] as const;

/** Per-area No access / View / Edit switch. */
export function AccessEditor({ areas, value, onChange }: { areas: Area[]; value: AccessMap; onChange: (v: AccessMap) => void }) {
  return (
    <div className="field">
      <span>Area access</span>
      <table className="access-grid card">
        <tbody>
          {areas.map((a) => {
            const current = value[a.id] ?? "none";
            return (
              <tr key={a.id}>
                <td><AreaTag area={a} /></td>
                <td style={{ textAlign: "right" }}>
                  <div className="seg">
                    {OPTIONS.map(([opt, label]) => (
                      <button key={opt} type="button" className={current === opt ? "on" : ""} onClick={() => onChange({ ...value, [a.id]: opt })}>
                        {label}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
