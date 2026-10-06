import { describe, expect, it } from "vitest";
import { fullMonthsBetween, fullyVestedOn, nextVesting, vestedOptions } from "./vesting";

const grant = {
  options: 4800, vesting_start: "2026-01-15", vesting_months: 48, cliff_months: 12,
  vesting_frequency: "monthly" as const, status: "active" as const,
};

describe("fullMonthsBetween", () => {
  it("counts a month once its day is reached", () => {
    expect(fullMonthsBetween("2026-01-15", "2026-02-14")).toBe(0);
    expect(fullMonthsBetween("2026-01-15", "2026-02-15")).toBe(1);
    expect(fullMonthsBetween("2026-01-15", "2027-01-15")).toBe(12);
  });
  it("treats the last day of a short month as reaching a month-end start date", () => {
    expect(fullMonthsBetween("2026-01-31", "2026-02-27")).toBe(0);
    expect(fullMonthsBetween("2026-01-31", "2026-02-28")).toBe(1);
    expect(fullMonthsBetween("2026-01-31", "2026-03-30")).toBe(1);
    expect(fullMonthsBetween("2026-01-31", "2026-03-31")).toBe(2);
  });
  it("keeps month-end grants on a steady monthly schedule", () => {
    const g = { ...grant, vesting_start: "2026-01-31", cliff_months: 0 };
    expect(nextVesting(g, "2026-02-01")).toEqual({ date: "2026-02-28", vested: 100 });
    expect(nextVesting(g, "2026-02-28")).toEqual({ date: "2026-03-31", vested: 200 });
  });
});

describe("vestedOptions", () => {
  it("vests nothing before the cliff", () => {
    expect(vestedOptions(grant, "2026-10-06")).toBe(0);
    expect(vestedOptions(grant, "2027-01-14")).toBe(0);
  });
  it("vests 25% at a 12-month cliff, then monthly", () => {
    expect(vestedOptions(grant, "2027-01-15")).toBe(1200);
    expect(vestedOptions(grant, "2027-02-15")).toBe(1300);
  });
  it("caps at the full grant", () => {
    expect(vestedOptions(grant, "2030-01-15")).toBe(4800);
    expect(vestedOptions(grant, "2035-01-01")).toBe(4800);
  });
  it("vests quarterly and yearly in steps", () => {
    expect(vestedOptions({ ...grant, vesting_frequency: "quarterly" }, "2027-03-15")).toBe(1200);
    expect(vestedOptions({ ...grant, vesting_frequency: "quarterly" }, "2027-04-15")).toBe(1500);
    expect(vestedOptions({ ...grant, vesting_frequency: "yearly" }, "2028-12-31")).toBe(2400);
  });
  it("stops at the exit date and ignores cancelled grants", () => {
    expect(vestedOptions(grant, "2030-01-01", "2027-03-20")).toBe(1400);
    expect(vestedOptions({ ...grant, status: "cancelled" }, "2030-01-01")).toBe(0);
  });
  it("handles no cliff", () => {
    expect(vestedOptions({ ...grant, cliff_months: 0 }, "2026-02-15")).toBe(100);
  });
});

describe("nextVesting / fullyVestedOn", () => {
  it("finds the cliff as the next vest before it", () => {
    expect(nextVesting(grant, "2026-10-06")).toEqual({ date: "2027-01-15", vested: 1200 });
  });
  it("finds the next monthly step after the cliff", () => {
    expect(nextVesting(grant, "2027-01-15")).toEqual({ date: "2027-02-15", vested: 1300 });
  });
  it("returns null when fully vested or after exit", () => {
    expect(nextVesting(grant, "2030-01-15")).toBeNull();
    expect(nextVesting(grant, "2027-06-01", "2027-05-01")).toBeNull();
  });
  it("clamps month ends", () => {
    expect(fullyVestedOn({ ...grant, vesting_start: "2026-01-31", vesting_months: 1 })).toBe("2026-02-28");
  });
});
