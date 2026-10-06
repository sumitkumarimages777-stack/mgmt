import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Filing } from "../lib/types";
import { keys, unwrap } from "./core";

export function useFilings(enabled = true) {
  return useQuery({
    enabled,
    queryKey: keys.filings,
    queryFn: () => unwrap<Filing[]>(supabase.from("filings").select("*").order("due_date")),
  });
}

export type FilingInput = Partial<Omit<Filing, "id" | "created_at" | "updated_at" | "created_by">>;

export async function saveFiling(id: string | null, input: FilingInput) {
  if (id) return unwrap<Filing>(supabase.from("filings").update(input).eq("id", id).select().single());
  return unwrap<Filing>(supabase.from("filings").insert(input).select().single());
}

export async function deleteFiling(id: string) {
  return unwrap(supabase.from("filings").delete().eq("id", id));
}

/** Bulk-insert filings, skipping ones that already exist (same title + period). Returns how many were added. */
export async function insertFilingsSkippingExisting(rows: FilingInput[]): Promise<number> {
  const { data, error } = await supabase
    .from("filings")
    .upsert(rows, { onConflict: "title,period", ignoreDuplicates: true })
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

/** Insert filings, or update the due date of ones that already exist (same title + period). */
export async function upsertFilings(rows: FilingInput[]) {
  await unwrap(supabase.from("filings").upsert(rows, { onConflict: "title,period" }));
}
