import { useMemo } from "react";
import { useSalarySnapshot, useTdsPayments, useTdsRules } from "../../../api";
import { useAuth } from "../../auth/AuthContext";
import { eligibleForTds, type Eligible } from "./tdsLogic";

/** Register rows for a month plus eligible people not yet added to it. */
export function useTdsMonth(month: string) {
  const { can } = useAuth();
  const payments = useTdsPayments();
  const rules = useTdsRules();
  const snapshot = useSalarySnapshot(month, can("ca.tds", "edit"));

  return useMemo(() => {
    const rows = (payments.data ?? []).filter((p) => p.month === month);
    const inRegister = new Set(rows.map((p) => `${p.employee_id}|${p.section}`));
    const missing: Eligible[] = eligibleForTds(snapshot.data ?? [], rules.data ?? []).filter(
      (e) => !inRegister.has(`${e.person.employee_id}|${e.rule.section}`),
    );
    return {
      rows,
      missing,
      total: rows.reduce((sum, p) => sum + Number(p.tds_amount), 0),
      pending: rows.filter((p) => p.status === "pending"),
      isLoading: payments.isLoading,
      error: payments.error ?? snapshot.error ?? rules.error,
    };
  }, [payments.data, payments.isLoading, payments.error, rules.data, rules.error, snapshot.data, snapshot.error, month]);
}
