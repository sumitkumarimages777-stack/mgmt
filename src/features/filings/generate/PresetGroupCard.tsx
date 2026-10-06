import type { Area } from "../../../lib/types";
import { COMPLIANCE_GROUP_LABEL, COMPLIANCE_PRESETS, type ComplianceGroup } from "../compliancePresets";

interface Props {
  group: ComplianceGroup;
  areas: Area[];
  areaId: string;
  onAreaChange: (id: string) => void;
  selected: Set<string>;
  onToggle: (presetKey: string) => void;
}

/** One block of presets (e.g. GST / TDS / Income Tax) with the area they go into. */
export function PresetGroupCard({ group, areas, areaId, onAreaChange, selected, onToggle }: Props) {
  return (
    <div className="card card-pad">
      <div className="actions" style={{ justifyContent: "space-between", marginBottom: 10 }}>
        <h3>{COMPLIANCE_GROUP_LABEL[group]}</h3>
        <label className="actions small">
          <span className="muted">Put in area</span>
          <select className="select" style={{ width: "auto" }} value={areaId} onChange={(e) => onAreaChange(e.target.value)}>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
      </div>
      <div className="grid grid-2" style={{ gap: 8 }}>
        {COMPLIANCE_PRESETS.filter((p) => p.group === group).map((p) => (
          <label key={p.key} className="check">
            <input type="checkbox" checked={selected.has(p.key)} onChange={() => onToggle(p.key)} />
            <span>
              <strong>{p.formCode}</strong> {p.title !== p.formCode && <span className="muted">· {p.title}</span>}
              <div className="faint small">{p.frequency} · {p.note}</div>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
