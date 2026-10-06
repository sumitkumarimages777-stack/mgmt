import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { EsopGrant } from "../lib/types";
import { keys, unwrap } from "./core";

export function useEsopGrants(enabled = true) {
  return useQuery({
    queryKey: keys.esop,
    enabled,
    queryFn: () => unwrap<EsopGrant[]>(supabase.from("esop_grants").select("*").order("grant_date", { ascending: false })),
  });
}

export type GrantInput = Partial<Omit<EsopGrant, "id">>;

export async function saveGrant(id: string | null, input: GrantInput) {
  if (id) await unwrap(supabase.from("esop_grants").update(input).eq("id", id));
  else await unwrap(supabase.from("esop_grants").insert(input));
}

export async function deleteGrant(id: string) {
  await unwrap(supabase.from("esop_grants").delete().eq("id", id));
}
