import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

/** Service-role client: bypasses RLS, so every caller must be checked first. */
export function serviceClient(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** The caller's user id if they are a signed-in, active user holding the Admin role; otherwise an error message + status. */
export async function requireAdmin(
  admin: SupabaseClient,
  req: Request,
): Promise<{ userId: string } | { error: string; status: number }> {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const { data } = await admin.auth.getUser(token);
  if (!data?.user) return { error: "Not signed in", status: 401 };
  const { data: me } = await admin.from("profiles").select("is_active").eq("id", data.user.id).single();
  const { data: adminRole } = await admin
    .from("user_roles").select("role_id, roles!inner(is_superuser)")
    .eq("user_id", data.user.id).eq("roles.is_superuser", true).limit(1);
  if (!me?.is_active || !adminRole?.length) return { error: "Admins only", status: 403 };
  return { userId: data.user.id };
}
