import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Asset, AssetAssignment } from "../lib/types";
import { keys, unwrap } from "./core";

export function useAssets(enabled = true) {
  return useQuery({
    queryKey: keys.assets,
    enabled,
    queryFn: () => unwrap<Asset[]>(supabase.from("assets").select("*").order("name")),
  });
}

/** Every assignment the user may see (all, or just their own), newest first. */
export function useAssignments(enabled = true) {
  return useQuery({
    queryKey: keys.assignments,
    enabled,
    queryFn: () =>
      unwrap<AssetAssignment[]>(supabase.from("asset_assignments").select("*").order("assigned_on", { ascending: false })),
  });
}

export type AssetInput = Partial<Omit<Asset, "id">>;

export async function saveAsset(id: string | null, input: AssetInput) {
  if (id) await unwrap(supabase.from("assets").update(input).eq("id", id));
  else await unwrap(supabase.from("assets").insert(input));
}

export async function deleteAsset(id: string) {
  await unwrap(supabase.from("assets").delete().eq("id", id));
}

export type AssignInput = Pick<AssetAssignment, "asset_id" | "employee_id" | "assigned_on" | "condition_out" | "notes">;

export async function assignAsset(input: AssignInput) {
  await unwrap(supabase.from("asset_assignments").insert(input));
}

export async function returnAsset(assignmentId: string, returnedOn: string, conditionIn: string | null) {
  await unwrap(
    supabase.from("asset_assignments").update({ returned_on: returnedOn, condition_in: conditionIn }).eq("id", assignmentId),
  );
}
