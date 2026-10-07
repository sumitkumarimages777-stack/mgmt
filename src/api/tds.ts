import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { SalarySnapshot, TdsPayment, TdsRule } from "../lib/types";
import { keys, unwrap } from "./core";

export function useTdsRules(enabled = true) {
  return useQuery({
    queryKey: keys.tdsRules,
    enabled,
    queryFn: () => unwrap<TdsRule[]>(supabase.from("tds_rules").select("*").order("section").order("threshold")),
  });
}

export type TdsRuleInput = Omit<TdsRule, "id">;

export async function saveTdsRule(id: string | null, input: TdsRuleInput) {
  if (id) await unwrap(supabase.from("tds_rules").update(input).eq("id", id));
  else await unwrap(supabase.from("tds_rules").insert(input));
}

export async function deleteTdsRule(id: string) {
  await unwrap(supabase.from("tds_rules").delete().eq("id", id));
}

export function useTdsPayments(enabled = true) {
  return useQuery({
    queryKey: keys.tdsPayments,
    enabled,
    queryFn: () =>
      unwrap<TdsPayment[]>(supabase.from("tds_payments").select("*").order("month", { ascending: false }).order("employee_name")),
  });
}

/** Team members working in the month and their salary then. Needs ca.tds view; no HR access required. */
export function useSalarySnapshot(month: string, enabled = true) {
  return useQuery({
    queryKey: keys.tdsSnapshot(month),
    enabled,
    queryFn: () => unwrap<SalarySnapshot[]>(supabase.rpc("tds_salary_snapshot", { p_month: month })),
  });
}

export type TdsPaymentInput = Omit<TdsPayment, "id">;

/** Add register rows, skipping people already in that month under the same section. */
export async function addTdsPayments(rows: TdsPaymentInput[]) {
  if (rows.length === 0) return;
  await unwrap(supabase.from("tds_payments").upsert(rows, { onConflict: "month,employee_id,section", ignoreDuplicates: true }));
}

export async function updateTdsPayment(id: string, input: Partial<TdsPaymentInput>) {
  await unwrap(supabase.from("tds_payments").update(input).eq("id", id));
}

/** Mark several rows paid with one challan. */
export async function markTdsPaid(ids: string[], paidOn: string, challan: string | null) {
  await unwrap(supabase.from("tds_payments").update({ status: "paid", paid_on: paidOn, challan_number: challan }).in("id", ids));
}

export async function deleteTdsPayment(id: string) {
  await unwrap(supabase.from("tds_payments").delete().eq("id", id));
}
