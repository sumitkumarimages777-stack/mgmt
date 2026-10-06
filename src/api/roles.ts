import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { AccessLevel, PermissionDef, Role, RolePermission, UserRole } from "../lib/types";
import { keys, unwrap } from "./core";

export function usePermissionCatalog() {
  return useQuery({
    queryKey: keys.permissions,
    staleTime: Infinity,
    queryFn: () => unwrap<PermissionDef[]>(supabase.from("permissions").select("*").order("module").order("sort")),
  });
}

export function useRoles() {
  return useQuery({
    queryKey: keys.roles,
    queryFn: async () => {
      const [roles, grants] = await Promise.all([
        unwrap<Role[]>(supabase.from("roles").select("*").order("is_superuser", { ascending: false }).order("name")),
        unwrap<RolePermission[]>(supabase.from("role_permissions").select("*")),
      ]);
      return { roles, grants };
    },
  });
}

/** Everyone's role assignments (admins only — others just see their own). */
export function useUserRoles(enabled = true) {
  return useQuery({
    queryKey: keys.userRoles,
    enabled,
    queryFn: () => unwrap<UserRole[]>(supabase.from("user_roles").select("user_id, role_id")),
  });
}

/** permission key -> level; missing key = no access. */
export type GrantMap = Record<string, AccessLevel>;

export interface RoleInput {
  name: string;
  description: string | null;
  grants: GrantMap;
}

/** Create or update a role and make its permissions exactly `grants`. */
export async function saveRole(id: string | null, input: RoleInput) {
  const row = { name: input.name, description: input.description };
  const role = id
    ? await unwrap<Role>(supabase.from("roles").update(row).eq("id", id).select().single())
    : await unwrap<Role>(supabase.from("roles").insert(row).select().single());
  const rows = Object.entries(input.grants).map(([permission_key, level]) => ({ role_id: role.id, permission_key, level }));
  if (rows.length) await unwrap(supabase.from("role_permissions").upsert(rows));
  // Remove grants that are no longer ticked (after the upsert, so a failure never leaves the role empty).
  const keep = rows.map((r) => r.permission_key);
  let stale = supabase.from("role_permissions").delete().eq("role_id", role.id);
  if (keep.length) stale = stale.not("permission_key", "in", `(${keep.map((k) => `"${k}"`).join(",")})`);
  await unwrap(stale);
}

export async function deleteRole(id: string) {
  await unwrap(supabase.from("roles").delete().eq("id", id));
}

/** Make a person's roles exactly `roleIds`. */
export async function setUserRoles(userId: string, current: string[], roleIds: string[]) {
  const add = roleIds.filter((r) => !current.includes(r));
  const remove = current.filter((r) => !roleIds.includes(r));
  if (add.length) await unwrap(supabase.from("user_roles").insert(add.map((role_id) => ({ user_id: userId, role_id }))));
  if (remove.length) await unwrap(supabase.from("user_roles").delete().eq("user_id", userId).in("role_id", remove));
}
