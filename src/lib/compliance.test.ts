import { describe, expect, it } from "vitest";
import { COMPLIANCE_PRESETS, generateCompliance } from "./compliance";

describe("generateCompliance", () => {
  it("creates 12 monthly GSTR-3B filings from May to April", () => {
    const rows = generateCompliance(2026, ["gstr3b"]);
    expect(rows).toHaveLength(12);
    expect(rows[0]).toMatchObject({ period: "Apr 2026", due_date: "2026-05-20" });
    expect(rows[8]).toMatchObject({ period: "Dec 2026", due_date: "2027-01-20" });
    expect(rows[11]).toMatchObject({ period: "Mar 2027", due_date: "2027-04-20" });
  });

  it("uses 30 April for March TDS payment", () => {
    const rows = generateCompliance(2026, ["tds_payment"]);
    expect(rows.find((r) => r.period === "Mar 2027")?.due_date).toBe("2027-04-30");
    expect(rows.find((r) => r.period === "Feb 2027")?.due_date).toBe("2027-03-07");
  });

  it("places quarterly TDS returns on the statutory dates", () => {
    const due = generateCompliance(2026, ["tds_return"]).map((r) => r.due_date);
    expect(due).toEqual(["2026-07-31", "2026-10-31", "2027-01-31", "2027-05-31"]);
  });

  it("puts annual returns for the year in the following year", () => {
    const byKey = Object.fromEntries(
      generateCompliance(2026, ["itr", "aoc4", "mgt7", "gstr9", "dpt3", "tax_audit"]).map((r) => [r.presetKey, r.due_date]),
    );
    expect(byKey).toEqual({
      dpt3: "2027-06-30",
      tax_audit: "2027-09-30",
      itr: "2027-10-31",
      aoc4: "2027-10-30",
      mgt7: "2027-11-29",
      gstr9: "2027-12-31",
    });
  });

  it("gives every preset a unique period per filing and sorts by due date", () => {
    const rows = generateCompliance(2026, COMPLIANCE_PRESETS.map((p) => p.key));
    const keys = rows.map((r) => `${r.title}|${r.period}`);
    expect(new Set(keys).size).toBe(keys.length);
    const dates = rows.map((r) => r.due_date);
    expect(dates).toEqual([...dates].sort());
    expect(rows.every((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.due_date))).toBe(true);
  });

  it("ignores unknown preset keys", () => {
    expect(generateCompliance(2026, ["nope"])).toEqual([]);
  });
});
