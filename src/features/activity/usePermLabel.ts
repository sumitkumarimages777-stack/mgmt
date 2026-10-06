import { usePermissionCatalog } from "../../api";
import { MODULE_LABEL } from "../../lib/labels";

/** "ca.filings" -> "CA & Compliance · Filings" */
export function usePermLabel() {
  const catalog = usePermissionCatalog();
  return (key: string | null) => {
    if (!key) return "—";
    const p = catalog.data?.find((x) => x.key === key);
    return p ? `${MODULE_LABEL[p.module]} · ${p.label}` : key;
  };
}
