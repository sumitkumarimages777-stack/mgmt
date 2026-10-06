import { describe, expect, it } from "vitest";
import { contractAlert, noticeDeadline } from "./contractAlerts";

const signed = { status: "signed" as const, end_date: "2027-03-31", renewal_notice_days: 90 };

describe("contractAlert", () => {
  it("ignores unsigned contracts and contracts without an end date", () => {
    expect(contractAlert({ ...signed, status: "draft" }, "2027-03-30")).toBeNull();
    expect(contractAlert({ ...signed, end_date: null }, "2027-03-30")).toBeNull();
  });
  it("flags the renewal notice window", () => {
    expect(contractAlert(signed, "2026-12-30")).toBeNull();
    expect(contractAlert(signed, "2026-12-31")).toBe("renewal_due");
  });
  it("flags contracts ending soon when there is no notice period", () => {
    const c = { ...signed, renewal_notice_days: null };
    expect(contractAlert(c, "2027-01-29")).toBeNull();
    expect(contractAlert(c, "2027-01-30")).toBe("expiring_soon");
  });
  it("flags expired contracts", () => {
    expect(contractAlert(signed, "2027-04-01")).toBe("expired");
  });
});

describe("noticeDeadline", () => {
  it("subtracts the notice period from the end date", () => {
    expect(noticeDeadline(signed)).toBe("2026-12-31");
    expect(noticeDeadline({ ...signed, renewal_notice_days: null })).toBeNull();
  });
});
