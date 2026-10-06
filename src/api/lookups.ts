import { useProfiles } from "./profiles";

/** Id → person lookups used all over the UI. */
export function useLookups() {
  const profiles = useProfiles();
  const personById = new Map((profiles.data ?? []).map((p) => [p.id, p]));
  return {
    personById,
    personName: (id: string | null | undefined) => {
      if (!id) return "—";
      const p = personById.get(id);
      return p ? p.full_name || p.email : "Unknown";
    },
  };
}
