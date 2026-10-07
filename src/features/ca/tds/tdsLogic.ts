// Pure TDS rules: who is eligible, what goes in the register, and when it's due.
import type { TdsPaymentInput } from "../../../api";
import type { SalarySnapshot, TdsRule } from "../../../lib/types";

/** yyyy-mm-01 for the month containing `iso`. */
export function monthOf(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

/** Move a yyyy-mm-01 month by `n` months. */
export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

const monthFmt = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" });

/** "Sep 2026" */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return monthFmt.format(new Date(y, m - 1, 1));
}

/** TDS deducted in a month is paid by the 7th of the next month; March's by 30 April. */
export function tdsDueDate(month: string): string {
  const next = addMonths(month, 1);
  return month.slice(5, 7) === "03" ? `${next.slice(0, 7)}-30` : `${next.slice(0, 7)}-07`;
}

export function ruleSalary(rule: Pick<TdsRule, "basis">, s: SalarySnapshot): number {
  return rule.basis === "annual" ? s.annual_ctc : s.monthly_gross;
}

/** Does this rule cover this person? Salary must be above the threshold. */
export function ruleMatches(rule: TdsRule, s: SalarySnapshot): boolean {
  if (!rule.is_active) return false;
  if (rule.employment_types?.length && !rule.employment_types.includes(s.employment_type)) return false;
  return ruleSalary(rule, s) > rule.threshold;
}

export interface Eligible {
  person: SalarySnapshot;
  rule: TdsRule;
}

/** Everyone eligible, once per section (the first matching rule for a section wins). */
export function eligibleForTds(people: SalarySnapshot[], rules: TdsRule[]): Eligible[] {
  const out: Eligible[] = [];
  for (const person of people) {
    const seen = new Set<string>();
    for (const rule of rules) {
      if (seen.has(rule.section) || !ruleMatches(rule, person)) continue;
      seen.add(rule.section);
      out.push({ person, rule });
    }
  }
  return out;
}

/** Register row for one eligible person; the amount is estimated only when the rule has a rate. */
export function toPaymentRow(month: string, { person, rule }: Eligible): TdsPaymentInput {
  const rate = rule.rate_percent ?? 0;
  return {
    month,
    employee_id: person.employee_id,
    employee_name: person.full_name,
    pan: person.pan,
    section: rule.section,
    salary_amount: person.monthly_gross,
    tds_amount: Math.round((person.monthly_gross * rate) / 100),
    status: "pending",
    paid_on: null,
    challan_number: null,
    notes: null,
  };
}
