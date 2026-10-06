import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Area, AreaMember } from "../lib/types";
import { keys, unwrap } from "./core";

export function useAreas() {
  return useQuery({
    queryKey: keys.areas,
    queryFn: () => unwrap<Area[]>(supabase.from("areas").select("*").order("name")),
  });
}

export function useAreaMembers(enabled = true) {
  return useQuery({
    queryKey: keys.members,
    enabled,
    queryFn: () => unwrap<AreaMember[]>(supabase.from("area_members").select("area_id, user_id, permission")),
  });
}

export type AreaInput = Pick<Area, "name" | "description" | "color">;

export async function saveArea(id: string | null, input: AreaInput) {
  const { error } = id
    ? await supabase.from("areas").update(input).eq("id", id)
    : await supabase.from("areas").insert(input);
  if (error) throw error;
}

export async function deleteArea(id: string) {
  const { error } = await supabase.from("areas").delete().eq("id", id);
  if (error?.code === "23503") {
    throw new Error("This area still has filings, requests or documents. Move or delete them first.");
  }
  if (error) throw error;
}
