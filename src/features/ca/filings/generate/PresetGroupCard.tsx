import { COMPLIANCE_GROUP_LABEL, COMPLIANCE_PRESETS, type ComplianceGroup } from "../compliancePresets";

interface Props {
  group: ComplianceGroup;
  selected: Set<string>;
  onToggle: (presetKey: string) => void;
}

/** One block of presets, e.g. GST / TDS / Income Tax. */
export function PresetGroupCard({ group, selected, onToggle }: Props) {
  return (
    <div className="card card-pad">
      <h3 style={{ marginBottom: 10 }}>{COMPLIANCE_GROUP_LABEL[group]}</h3>
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
