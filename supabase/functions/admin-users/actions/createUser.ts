import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { json, type Body } from "../http.ts";
import { checkCredentials, PERMISSIONS, ROLES } from "../validate.ts";

type AccessEntry = { area_id: string; permission: string };

function parseAccess(access: unknown): AccessEntry[] | null {
  const list = Array.isArray(access) ? access : [];
  const valid = list.every((a) => a && typeof a.area_id === "string" && PERMISSIONS.includes(a.permission));
  return valid ? list : null;
}

/** Create a login with a temporary password, then set role, firm and area access. */
export async function createUser(admin: SupabaseClient, body: Body): Promise<Response> {
  const { email, password, full_name, organization, role } = body;
  const problem = checkCredentials(email, password);
  if (problem) return json({ error: problem }, 400);
  if (!ROLES.includes(String(role))) return json({ error: "Invalid role" }, 400);
  const access = parseAccess(body.access);
  if (!access) return json({ error: "Invalid area access entry" }, 400);

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
    role,
  }).eq("id", userId);
  if (profileError) throw profileError;

  if (access.length) {
    const rows = access.map((a) => ({ area_id: a.area_id, user_id: userId, permission: a.permission }));
    const { error: accessError } = await admin.from("area_members").insert(rows);
    if (accessError) throw accessError;
  }
  return json({ ok: true, user_id: userId });
}
