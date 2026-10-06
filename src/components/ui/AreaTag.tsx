import type { Area } from "../../lib/types";

export function AreaTag({ area }: { area: Area | undefined }) {
  if (!area) return <span className="area-tag">—</span>;
  return (
    <span className="area-tag">
      <span className="area-dot" style={{ background: area.color }} />
      {area.name}
    </span>
  );
}
