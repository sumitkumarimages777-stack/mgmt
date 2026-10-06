import { AREA_COLORS } from "./colors";

export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="actions">
      {AREA_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={c}
          onClick={() => onChange(c)}
          style={{
            width: 26, height: 26, borderRadius: 99, background: c, cursor: "pointer",
            border: value === c ? "3px solid var(--text)" : "2px solid var(--surface)",
          }}
        />
      ))}
    </div>
  );
}
