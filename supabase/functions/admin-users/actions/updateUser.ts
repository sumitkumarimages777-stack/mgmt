import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { json, type Body } from "../http.ts";
import { checkEmail, checkPassword } from "../validate.ts";

export async function setPassword(admin: SupabaseClient, body: Body): Promise<Response> {
  const { user_id, password } = body;
  if (typeof user_id !== "string") return json({ error: "user_id is required" }, 400);
  const problem = checkPassword(password);
  if (problem) return json({ error: problem }, 400);
  const { error } = await admin.auth.admin.updateUserById(user_id, { password: password as string });
  if (error) return json({ error: error.message }, 400);
  return json({ ok: true });
}

/** Correct someone's login email (auth record + profile). */
export async function setEmail(admin: SupabaseClient, body: Body): Promise<Response> {
  const { user_id, email } = body;
  if (typeof user_id !== "string") return json({ error: "user_id is required" }, 400);
  const problem = checkEmail(email);
  if (problem) return json({ error: problem }, 400);
  const newEmail = (email as string).trim().toLowerCase();
  const { error } = await admin.auth.admin.updateUserById(user_id, { email: newEmail, email_confirm: true });
  if (error) return json({ error: error.message }, 400);
  const { error: profileError } = await admin.from("profiles").update({ email: newEmail }).eq("id", user_id);
  if (profileError) throw profileError;
  return json({ ok: true });
}

/** Deactivate (profile + sign-in ban) or reactivate a login. */
export async function setActive(admin: SupabaseClient, body: Body, callerId: string): Promise<Response> {
  const { user_id, active } = body;
  if (typeof user_id !== "string" || typeof active !== "boolean") {
    return json({ error: "user_id and active are required" }, 400);
  }
  if (user_id === callerId && !active) return json({ error: "You cannot deactivate yourself" }, 400);
  const { error: profileError } = await admin.from("profiles").update({ is_active: active }).eq("id", user_id);
  if (profileError) return json({ error: profileError.message }, 400);
  const { error } = await admin.auth.admin.updateUserById(user_id, { ban_duration: active ? "none" : "876000h" });
  if (error) return json({ error: error.message }, 400);
  return json({ ok: true });
}
