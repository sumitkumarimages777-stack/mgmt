import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Contract, LegalMatter } from "../lib/types";
import { keys, unwrap } from "./core";

export function useContracts(enabled = true) {
  return useQuery({
    queryKey: keys.contracts,
    enabled,
    queryFn: () => unwrap<Contract[]>(supabase.from("contracts").select("*").order("end_date", { nullsFirst: false })),
  });
}

export type ContractInput = Partial<Omit<Contract, "id" | "created_at">>;

export async function saveContract(id: string | null, input: ContractInput) {
  if (id) await unwrap(supabase.from("contracts").update(input).eq("id", id));
  else await unwrap(supabase.from("contracts").insert(input));
}

export async function deleteContract(id: string) {
  await unwrap(supabase.from("contracts").delete().eq("id", id));
}

export function useMatters(enabled = true) {
  return useQuery({
    queryKey: keys.matters,
    enabled,
    queryFn: () => unwrap<LegalMatter[]>(supabase.from("legal_matters").select("*").order("next_date", { nullsFirst: false })),
  });
}

export type MatterInput = Partial<Omit<LegalMatter, "id" | "created_at">>;

export async function saveMatter(id: string | null, input: MatterInput) {
  if (id) await unwrap(supabase.from("legal_matters").update(input).eq("id", id));
  else await unwrap(supabase.from("legal_matters").insert(input));
}

export async function deleteMatter(id: string) {
  await unwrap(supabase.from("legal_matters").delete().eq("id", id));
}
