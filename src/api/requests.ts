import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { DocumentRequest } from "../lib/types";
import { keys, unwrap } from "./core";

export function useRequests(enabled = true) {
  return useQuery({
    enabled,
    queryKey: keys.requests,
    queryFn: () =>
      unwrap<DocumentRequest[]>(supabase.from("document_requests").select("*").order("created_at", { ascending: false })),
  });
}

export type RequestInput = Partial<
  Pick<DocumentRequest, "module" | "title" | "description" | "filing_id" | "due_date" | "status">
>;

export async function saveRequest(id: string | null, input: RequestInput) {
  if (id) return unwrap(supabase.from("document_requests").update(input).eq("id", id).select().single());
  return unwrap(supabase.from("document_requests").insert(input).select().single());
}

export async function deleteRequest(id: string) {
  return unwrap(supabase.from("document_requests").delete().eq("id", id));
}
