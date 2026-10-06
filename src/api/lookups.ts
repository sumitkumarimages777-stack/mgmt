import { useAreas } from "./areas";
import { useProfiles } from "./profiles";

/** Id → area / person lookups used all over the UI. */
export function useLookups() {
  const areas = useAreas();
  const profiles = useProfiles();
  const areaById = new Map((areas.data ?? []).map((a) => [a.id, a]));
  const personById = new Map((profiles.data ?? []).map((p) => [p.id, p]));
  return {
    areas: areas.data ?? [],
    areaById,
    personById,
    personName: (id: string | null | undefined) => {
      if (!id) return "—";
      const p = personById.get(id);
      return p ? p.full_name || p.email : "Unknown";
    },
  };
}
