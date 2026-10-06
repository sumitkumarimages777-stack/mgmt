import { describe, expect, it } from "vitest";
import { daysBetween, filingDueState, fyLabel, fyStartYear, relativeDue } from "./dates";

describe("dates", () => {
  it("counts days across month and year boundaries", () => {
    expect(daysBetween("2026-12-30", "2027-01-02")).toBe(3);
    expect(daysBetween("2026-10-06", "2026-10-01")).toBe(-5);
  });

  it("finds the Indian financial year", () => {
    expect(fyStartYear("2026-03-31")).toBe(2025);
    expect(fyStartYear("2026-04-01")).toBe(2026);
    expect(fyLabel(2026)).toBe("FY 2026-27");
    expect(fyLabel(2099)).toBe("FY 2099-00");
  });

  it("classifies filing urgency", () => {
    const today = "2026-10-06";
    expect(filingDueState({ status: "pending", due_date: "2026-10-05" }, today)).toBe("overdue");
    expect(filingDueState({ status: "in_progress", due_date: "2026-10-06" }, today)).toBe("due_soon");
    expect(filingDueState({ status: "pending", due_date: "2026-10-13" }, today)).toBe("due_soon");
    expect(filingDueState({ status: "pending", due_date: "2026-10-14" }, today)).toBe("upcoming");
    expect(filingDueState({ status: "filed", due_date: "2026-01-01" }, today)).toBe("filed");
    expect(filingDueState({ status: "not_applicable", due_date: "2026-01-01" }, today)).toBe("not_applicable");
  });

  it("describes relative due dates", () => {
    expect(relativeDue("2026-10-06", "2026-10-06")).toBe("due today");
    expect(relativeDue("2026-10-09", "2026-10-06")).toBe("in 3 days");
    expect(relativeDue("2026-10-01", "2026-10-06")).toBe("5 days late");
  });
});
