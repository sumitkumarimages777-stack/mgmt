// ESOP vesting maths. Pure functions, no I/O.
//
// Rules: nothing vests before the cliff; after that, options vest in equal
// steps (monthly / quarterly / yearly) over the vesting period. Vesting stops
// on the employee's exit date. A cancelled grant has nothing vested.

import { parseISO, toISO } from "../../../lib/dates";
import type { EsopGrant } from "../../../lib/types";

type Grant = Pick<EsopGrant, "options" | "vesting_start" | "vesting_months" | "cliff_months" | "vesting_frequency" | "status">;

const STEP_MONTHS = { monthly: 1, quarterly: 3, yearly: 12 } as const;

const daysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

/** Whole months from `from` to `to`. A month counts once its day is reached (31 Jan → 28 Feb is one month). */
export function fullMonthsBetween(from: string, to: string): number {
  const a = parseISO(from);
  const b = parseISO(to);
  const months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  return b.getDate() < Math.min(a.getDate(), daysInMonth(b)) ? months - 1 : months;
}

function addMonths(iso: string, months: number): string {
  const d = parseISO(iso);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  d.setDate(Math.min(day, daysInMonth(d)));
  return toISO(d);
}

function vestedMonthsAt(g: Grant, monthsElapsed: number): number {
  if (monthsElapsed < g.cliff_months) return 0;
  const step = STEP_MONTHS[g.vesting_frequency];
  return Math.min(g.vesting_months, Math.floor(monthsElapsed / step) * step);
}

/** Options vested on `asOf`, stopping at `stopAt` (exit date) if given. */
export function vestedOptions(g: Grant, asOf: string, stopAt?: string | null): number {
  if (g.status === "cancelled") return 0;
  const end = stopAt && stopAt < asOf ? stopAt : asOf;
  if (end < g.vesting_start) return 0;
  return Math.floor((g.options * vestedMonthsAt(g, fullMonthsBetween(g.vesting_start, end))) / g.vesting_months);
}

/** Next date on which more options vest after `asOf`, with the vested total then. Null when fully vested or stopped. */
export function nextVesting(g: Grant, asOf: string, stopAt?: string | null): { date: string; vested: number } | null {
  if (g.status === "cancelled" || (stopAt && stopAt <= asOf)) return null;
  const step = STEP_MONTHS[g.vesting_frequency];
  const current = vestedOptions(g, asOf, stopAt);
  for (let m = step; m <= g.vesting_months; m += step) {
    const date = addMonths(g.vesting_start, m);
    if (date <= asOf || m < g.cliff_months) continue;
    if (stopAt && date > stopAt) return null;
    const vested = vestedOptions(g, date, stopAt);
    if (vested > current) return { date, vested };
  }
  return null;
}

/** Date the grant is fully vested. */
export function fullyVestedOn(g: Grant): string {
  return addMonths(g.vesting_start, g.vesting_months);
}
