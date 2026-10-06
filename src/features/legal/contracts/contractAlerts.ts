import { addDays, daysBetween } from "../../../lib/dates";
import type { Contract } from "../../../lib/types";

export type ContractAlert = "expired" | "renewal_due" | "expiring_soon" | null;

/**
 * What needs attention on a signed contract:
 * - "expired": the end date has passed
 * - "renewal_due": inside the renewal-notice window (end date minus notice days)
 * - "expiring_soon": ends within `soonDays`
 */
export function contractAlert(c: Pick<Contract, "status" | "end_date" | "renewal_notice_days">, today: string, soonDays = 60): ContractAlert {
  if (c.status !== "signed" || !c.end_date) return null;
  if (c.end_date < today) return "expired";
  if (c.renewal_notice_days && today >= addDays(c.end_date, -c.renewal_notice_days)) return "renewal_due";
  if (daysBetween(today, c.end_date) <= soonDays) return "expiring_soon";
  return null;
}

/** Last day to send a renewal / termination notice, if a notice period is set. */
export function noticeDeadline(c: Pick<Contract, "end_date" | "renewal_notice_days">): string | null {
  return c.end_date && c.renewal_notice_days ? addDays(c.end_date, -c.renewal_notice_days) : null;
}
