import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Profile } from "../lib/types";
import { keys, unwrap } from "./core";

export function useProfiles() {
  return useQuery({
    queryKey: keys.profiles,
    queryFn: () => unwrap<Profile[]>(supabase.from("profiles").select("*").order("full_name")),
  });
}

export async function updateProfile(id: string, changes: Partial<Pick<Profile, "full_name" | "organization">>) {
  await unwrap(supabase.from("profiles").update(changes).eq("id", id));
}
