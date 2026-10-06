// admin-users — user management that needs the service-role key.
//
// Actions
//   bootstrap     (no login)  create the very first admin; refused once an admin exists
//   create_user   (admin)     create a login with a temporary password + area access
//   set_password  (admin)     reset someone's password
//   set_active    (admin)     deactivate / reactivate a login (also blocks sign-in)
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

const ROLES = ["admin", "staff", "external"];
const PERMISSIONS = ["view", "edit"];

function checkCredentials(email: unknown, password: unknown): string | null {
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "A valid email is required";
  if (typeof password !== "string" || password.length < 8) return "Password must be at least 8 characters";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  try {
    if (body.action === "bootstrap") {
      const { count, error: countError } = await admin
        .from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin");
      if (countError) throw countError;
      if (count) return json({ error: "Setup is already complete. Please sign in." }, 403);

      const { email, password, full_name } = body;
      const problem = checkCredentials(email, password);
      if (problem) return json({ error: problem }, 400);

      const { data, error } = await admin.auth.admin.createUser({
        email: email as string,
        password: password as string,
        email_confirm: true,
        user_metadata: { full_name: String(full_name ?? "") },
      });
      if (error) return json({ error: error.message }, 400);
      // handle_new_user already made them admin; this just makes it explicit.
      await admin.from("profiles").update({ role: "admin" }).eq("id", data.user.id);
      return json({ ok: true });
    }

    // Every other action needs a signed-in, active admin.
    const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    const { data: caller } = await admin.auth.getUser(token);
    if (!caller?.user) return json({ error: "Not signed in" }, 401);
    const { data: me } = await admin
      .from("profiles").select("role, is_active").eq("id", caller.user.id).single();
    if (!me || me.role !== "admin" || !me.is_active) return json({ error: "Admins only" }, 403);

    switch (body.action) {
      case "create_user": {
        const { email, password, full_name, organization, role, access } = body;
        const problem = checkCredentials(email, password);
        if (problem) return json({ error: problem }, 400);
        if (!ROLES.includes(String(role))) return json({ error: "Invalid role" }, 400);
        const accessList = Array.isArray(access) ? access : [];
        for (const a of accessList) {
          if (!a || typeof a.area_id !== "string" || !PERMISSIONS.includes(a.permission)) {
            return json({ error: "Invalid area access entry" }, 400);
          }
        }

        const { data, error } = await admin.auth.admin.createUser({
          email: email as string,
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

        if (accessList.length) {
          const { error: accessError } = await admin.from("area_members").insert(
            accessList.map((a: { area_id: string; permission: string }) => ({
              area_id: a.area_id,
              user_id: userId,
              permission: a.permission,
            })),
          );
          if (accessError) throw accessError;
        }
        return json({ ok: true, user_id: userId });
      }

      case "set_password": {
        const { user_id, password } = body;
        if (typeof user_id !== "string") return json({ error: "user_id is required" }, 400);
        if (typeof password !== "string" || password.length < 8) {
          return json({ error: "Password must be at least 8 characters" }, 400);
        }
        const { error } = await admin.auth.admin.updateUserById(user_id, { password });
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      case "set_active": {
        const { user_id, active } = body;
        if (typeof user_id !== "string" || typeof active !== "boolean") {
          return json({ error: "user_id and active are required" }, 400);
        }
        if (user_id === caller.user.id && !active) return json({ error: "You cannot deactivate yourself" }, 400);
        const { error: profileError } = await admin.from("profiles").update({ is_active: active }).eq("id", user_id);
        if (profileError) return json({ error: profileError.message }, 400);
        const { error } = await admin.auth.admin.updateUserById(user_id, {
          ban_duration: active ? "none" : "876000h",
        });
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
