import { useQuery } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import { keys } from "../../api";
import { supabase } from "../../lib/supabase";
import type { AreaMember, AreaPermission, Profile } from "../../lib/types";
import { AuthContext, type AuthState } from "./AuthContext";
import { useSession } from "./useSession";

async function loadMe(userId: string) {
  const [{ data: profile, error }, { data: members, error: mErr }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("area_members").select("area_id, user_id, permission").eq("user_id", userId),
  ]);
  if (error) throw error;
  if (mErr) throw mErr;
  return { profile: profile as Profile, members: (members ?? []) as AreaMember[] };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;
  const me = useQuery({ queryKey: [...keys.me, userId], enabled: !!userId, queryFn: () => loadMe(userId!) });

  const value = useMemo<AuthState>(() => {
    const profile = me.data?.profile ?? null;
    const active = !!profile?.is_active;
    const isAdmin = active && profile?.role === "admin";
    const permissions = new Map<string, AreaPermission>(
      (me.data?.members ?? []).map((m) => [m.area_id, m.permission]),
    );
    return {
      session,
      loading: sessionLoading || (!!userId && me.isLoading),
      profile,
      isAdmin,
      permissions,
      canView: (id) => isAdmin || (active && permissions.has(id)),
      canEdit: (id) => isAdmin || (active && permissions.get(id) === "edit"),
      canEditAny: isAdmin || (active && [...permissions.values()].includes("edit")),
      signOut: async () => {
        await supabase.auth.signOut();
      },
    };
  }, [session, sessionLoading, userId, me.data, me.isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
