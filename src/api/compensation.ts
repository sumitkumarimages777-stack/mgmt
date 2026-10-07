import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { PayrollDetails, SalaryRevision } from "../lib/types";
import { keys, unwrap } from "./core";

export function usePayroll(employeeId: string, enabled = true) {
  return useQuery({
    queryKey: keys.payroll(employeeId),
    enabled,
    queryFn: () =>
      unwrap<PayrollDetails | null>(supabase.from("employee_payroll").select("*").eq("employee_id", employeeId).maybeSingle()),
  });
}

export async function savePayroll(details: PayrollDetails) {
  await unwrap(supabase.from("employee_payroll").upsert(details));
}

export function useSalaryRevisions(employeeId: string, enabled = true) {
  return useQuery({
    queryKey: keys.salaries(employeeId),
    enabled,
    queryFn: () =>
      unwrap<SalaryRevision[]>(
        supabase.from("salary_revisions").select("*").eq("employee_id", employeeId).order("effective_from", { ascending: false }),
      ),
  });
}

/** Every salary revision the caller may see, newest first (for the team salary list). */
export function useAllSalaryRevisions(enabled = true) {
  return useQuery({
    queryKey: [...keys.allSalaries, "all"],
    enabled,
    queryFn: () => unwrap<SalaryRevision[]>(supabase.from("salary_revisions").select("*").order("effective_from", { ascending: false })),
  });
}

export type SalaryInput = Pick<SalaryRevision, "employee_id" | "effective_from" | "annual_ctc" | "monthly_gross" | "notes">;

export async function addSalaryRevision(input: SalaryInput) {
  await unwrap(supabase.from("salary_revisions").insert(input));
}

export async function deleteSalaryRevision(id: string) {
  await unwrap(supabase.from("salary_revisions").delete().eq("id", id));
}
