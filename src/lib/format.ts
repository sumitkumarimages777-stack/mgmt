export function formatBytes(n: number | null | undefined): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** Human-readable message from an Error, a Supabase error object, or anything else. */
export function errorMessage(e: unknown): string {
  if (!e) return "";
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return String(e);
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const count = new Intl.NumberFormat("en-IN");

/** ₹12,00,000 */
export function formatINR(n: number | null | undefined): string {
  return n === null || n === undefined ? "—" : inr.format(n);
}

/** 1,00,000 */
export function formatCount(n: number): string {
  return count.format(n);
}
