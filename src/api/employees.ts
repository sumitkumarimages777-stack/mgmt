import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Employee } from "../lib/types";
import { keys, unwrap } from "./core";

export function useEmployees(enabled = true) {
  return useQuery({
    queryKey: keys.employees,
    enabled,
    queryFn: () => unwrap<Employee[]>(supabase.from("employees").select("*").order("full_name")),
  });
}

export type EmployeeInput = Partial<Omit<Employee, "id" | "created_at" | "updated_at">>;

export async function saveEmployee(id: string | null, input: EmployeeInput) {
  if (id) return unwrap<Employee>(supabase.from("employees").update(input).eq("id", id).select().single());
  return unwrap<Employee>(supabase.from("employees").insert(input).select().single());
}

export async function deleteEmployee(id: string) {
  await unwrap(supabase.from("employees").delete().eq("id", id));
}
