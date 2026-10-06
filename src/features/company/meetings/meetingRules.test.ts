import { describe, expect, it } from "vitest";
import { COMPLIANCE_PRESETS } from "../../ca/filings/compliancePresets";
import { AGM_FILINGS, mgt14Due, rocDatesFromAgm } from "./meetingRules";

describe("meeting rules", () => {
  it("sets AOC-4 and MGT-7 from the AGM date", () => {
    expect(rocDatesFromAgm("2026-09-25")).toEqual({ aoc4: "2026-10-25", mgt7: "2026-11-24" });
  });
  it("sets MGT-14 30 days after the resolution", () => {
    expect(mgt14Due("2026-12-15")).toBe("2027-01-14");
  });
  it("matches the titles the compliance calendar uses, so AGM dates update those filings", () => {
    for (const f of AGM_FILINGS) {
      expect(COMPLIANCE_PRESETS.some((p) => p.title === f.title && p.formCode === f.form_code)).toBe(true);
    }
  });
});
