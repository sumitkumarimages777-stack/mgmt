import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { json, type Body } from "../http.ts";
import { checkCredentials, parseRoleIds } from "../validate.ts";

/** Create a login with a temporary password, then set name, firm and roles. */
export async function createUser(admin: SupabaseClient, body: Body): Promise<Response> {
  const { email, password, full_name, organization } = body;
  const problem = checkCredentials(email, password);
  if (problem) return json({ error: problem }, 400);
  const roleIds = parseRoleIds(body.role_ids);
  if (!roleIds) return json({ error: "Invalid role list" }, 400);

  const { data, error } = await admin.auth.admin.createUser({
    email: (email as string).trim(),
    password: password as string,
    email_confirm: true,
    user_metadata: { full_name: String(full_name ?? "") },
  });
  if (error) return json({ error: error.message }, 400);
  const userId = data.user.id;

  const { error: profileError } = await admin.from("profiles").update({
    full_name: String(full_name ?? ""),
    organization: organization ? String(organization) : null,
  }).eq("id", userId);
  if (profileError) throw profileError;

  if (roleIds.length) {
    const rows = roleIds.map((role_id) => ({ user_id: userId, role_id }));
    const { error: rolesError } = await admin.from("user_roles").insert(rows);
    if (rolesError) throw rolesError;
  }
  return json({ ok: true, user_id: userId });
}
