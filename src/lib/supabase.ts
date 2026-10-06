import { createClient } from "@supabase/supabase-js";

// The URL and publishable key are public by design — every browser that loads
// the app receives them. Data is protected by Row Level Security in the
// database, not by hiding these. Override with VITE_SUPABASE_* env vars.
const url = import.meta.env.VITE_SUPABASE_URL || "https://hietxqbfpjbbavupspvd.supabase.co";
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_6AJY1MstjjTf4eAOBVYGxw_D9cK0EaX";

export const supabase = createClient(url, key);

export const DOCUMENTS_BUCKET = "documents";

/** Call the admin-users Edge Function and surface its error message. */
export async function adminUsers<T = { ok: true }>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("admin-users", { body });
  if (error) {
    // FunctionsHttpError keeps the response; pull our { error } message out of it.
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      const payload = await ctx.json().catch(() => null);
      if (payload?.error) throw new Error(payload.error);
    }
    throw error;
  }
  return data as T;
}
