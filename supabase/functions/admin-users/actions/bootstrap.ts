import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { json, type Body } from "../http.ts";
import { checkCredentials } from "../validate.ts";

/** Create the very first admin. Refused once any admin exists. */
export async function bootstrap(admin: SupabaseClient, body: Body): Promise<Response> {
  const { count, error: countError } = await admin
    .from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin");
  if (countError) throw countError;
  if (count) return json({ error: "Setup is already complete. Please sign in." }, 403);

  const { email, password, full_name } = body;
  const problem = checkCredentials(email, password);
  if (problem) return json({ error: problem }, 400);

  const { data, error } = await admin.auth.admin.createUser({
    email: (email as string).trim(),
    password: password as string,
    email_confirm: true,
    user_metadata: { full_name: String(full_name ?? "") },
  });
  if (error) return json({ error: error.message }, 400);
  // handle_new_user already made them admin; this just makes it explicit.
  await admin.from("profiles").update({ role: "admin" }).eq("id", data.user.id);
  return json({ ok: true });
}
