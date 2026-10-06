// Calls to the admin-users Edge Function (needs the service-role key, so it
// can't run in the browser).
import { supabase } from "../lib/supabase";
import type { AreaPermission, UserRole } from "../lib/types";

async function call<T = { ok: true }>(body: Record<string, unknown>): Promise<T> {
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

export interface NewPerson {
  email: string;
  password: string;
  full_name: string;
  organization: string | null;
  role: UserRole;
  access: Array<{ area_id: string; permission: AreaPermission }>;
}

export const adminUsers = {
  bootstrap: (email: string, password: string, full_name: string) =>
    call({ action: "bootstrap", email, password, full_name }),
  createUser: (person: NewPerson) => call({ action: "create_user", ...person }),
  setPassword: (user_id: string, password: string) => call({ action: "set_password", user_id, password }),
  setEmail: (user_id: string, email: string) => call({ action: "set_email", user_id, email }),
  setActive: (user_id: string, active: boolean) => call({ action: "set_active", user_id, active }),
};
