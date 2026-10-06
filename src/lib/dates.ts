import type { Filing } from "./types";

/** Today's date as yyyy-mm-dd in the viewer's local time zone. */
export function todayISO(now: Date = new Date()): string {
  return toISO(now);
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse yyyy-mm-dd as a local calendar date (no UTC shift). */
export function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Whole days from `from` to `to` (both yyyy-mm-dd). Negative if `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((parseISO(to).getTime() - parseISO(from).getTime()) / 86_400_000);
}

export function addDays(iso: string, days: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
});

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return dateFmt.format(iso.length === 10 ? parseISO(iso) : new Date(iso));
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return dateTimeFmt.format(new Date(iso));
}

/** Start year of the Indian financial year (April–March) containing `iso`. */
export function fyStartYear(iso: string): number {
  const d = parseISO(iso);
  return d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
}

export function fyLabel(startYear: number): string {
  return `FY ${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

export type DueState = "filed" | "not_applicable" | "overdue" | "due_soon" | "upcoming";

/** How urgent a filing is today. "due_soon" = due within `soonDays` days. */
export function filingDueState(
  f: Pick<Filing, "status" | "due_date">,
  today: string = todayISO(),
  soonDays = 7,
): DueState {
  if (f.status === "filed") return "filed";
  if (f.status === "not_applicable") return "not_applicable";
  const days = daysBetween(today, f.due_date);
  if (days < 0) return "overdue";
  if (days <= soonDays) return "due_soon";
  return "upcoming";
}

/** "in 3 days", "today", "5 days late" */
export function relativeDue(due: string, today: string = todayISO()): string {
  const days = daysBetween(today, due);
  if (days === 0) return "due today";
  if (days === 1) return "due tomorrow";
  if (days > 0) return `in ${days} days`;
  if (days === -1) return "1 day late";
  return `${-days} days late`;
}
