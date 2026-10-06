import type { ReactNode } from "react";

/** Small muted label, e.g. a filing category or module. */
export function Tag({ children }: { children: ReactNode }) {
  if (!children) return <span className="tag">—</span>;
  return <span className="tag">{children}</span>;
}
