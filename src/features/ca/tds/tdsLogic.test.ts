import { describe, expect, it } from "vitest";
import type { SalarySnapshot, TdsRule } from "../../../lib/types";
import { addMonths, eligibleForTds, monthOf, tdsDueDate, toPaymentRow } from "./tdsLogic";

const rule = (over: Partial<TdsRule> = {}): TdsRule => ({
  id: "r1", name: "Salary", section: "192", basis: "annual", threshold: 1_000_000, rate_percent: null,
  employment_types: null, is_active: true, notes: null, ...over,
});
const person = (over: Partial<SalarySnapshot> = {}): SalarySnapshot => ({
  employee_id: "e1", full_name: "Asha", employee_code: null, employment_type: "full_time", pan: "ABCDE1234F",
  annual_ctc: 1_200_000, monthly_gross: 100_000, ...over,
});

describe("months and due dates", () => {
  it("normalises and moves months across years", () => {
    expect(monthOf("2026-10-07")).toBe("2026-10-01");
    expect(addMonths("2026-12-01", 1)).toBe("2027-01-01");
    expect(addMonths("2026-01-01", -1)).toBe("2025-12-01");
  });
  it("is due on the 7th of next month, and 30 April for March", () => {
    expect(tdsDueDate("2026-09-01")).toBe("2026-10-07");
    expect(tdsDueDate("2026-12-01")).toBe("2027-01-07");
    expect(tdsDueDate("2027-03-01")).toBe("2027-04-30");
  });
});

describe("eligibility", () => {
  it("needs salary strictly above the threshold", () => {
    expect(eligibleForTds([person()], [rule()])).toHaveLength(1);
    expect(eligibleForTds([person({ annual_ctc: 1_000_000 })], [rule()])).toHaveLength(0);
  });
  it("uses monthly gross for monthly rules", () => {
    expect(eligibleForTds([person()], [rule({ basis: "monthly", threshold: 99_999 })])).toHaveLength(1);
    expect(eligibleForTds([person()], [rule({ basis: "monthly", threshold: 100_000 })])).toHaveLength(0);
  });
  it("respects employment types and inactive rules", () => {
    expect(eligibleForTds([person()], [rule({ employment_types: ["consultant"] })])).toHaveLength(0);
    expect(eligibleForTds([person()], [rule({ is_active: false })])).toHaveLength(0);
  });
  it("lists a person once per section", () => {
    const rules = [rule(), rule({ id: "r2", threshold: 0 }), rule({ id: "r3", section: "194J", threshold: 0 })];
    expect(eligibleForTds([person()], rules).map((e) => e.rule.id)).toEqual(["r1", "r3"]);
  });
});

describe("register rows", () => {
  it("estimates TDS from the rule rate, or leaves it at zero", () => {
    expect(toPaymentRow("2026-09-01", { person: person(), rule: rule({ rate_percent: 10 }) }).tds_amount).toBe(10_000);
    expect(toPaymentRow("2026-09-01", { person: person(), rule: rule() }).tds_amount).toBe(0);
  });
});
