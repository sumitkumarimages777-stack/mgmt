import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { AreaPermission, Profile } from "../lib/types";
import { keys, unwrap } from "./core";

export function useProfiles() {
  return useQuery({
    queryKey: keys.profiles,
    queryFn: () => unwrap<Profile[]>(supabase.from("profiles").select("*").order("full_name")),
  });
}

export async function updateProfile(id: string, changes: Partial<Pick<Profile, "full_name" | "organization" | "role">>) {
  const { error } = await supabase.from("profiles").update(changes).eq("id", id);
  if (error) throw error;
}

/** area_id -> permission, or "none" to remove access. */
export type AccessMap = Record<string, AreaPermission | "none">;

/** Make a person's area access exactly match `access`. */
export async function replaceAreaAccess(userId: string, areaIds: string[], access: AccessMap) {
  const remove = areaIds.filter((id) => (access[id] ?? "none") === "none");
  const upsert = Object.entries(access)
    .filter(([, p]) => p !== "none")
    .map(([area_id, permission]) => ({ area_id, user_id: userId, permission }));
  if (remove.length) {
    const { error } = await supabase.from("area_members").delete().eq("user_id", userId).in("area_id", remove);
    if (error) throw error;
  }
  if (upsert.length) {
    const { error } = await supabase.from("area_members").upsert(upsert);
    if (error) throw error;
  }
}
