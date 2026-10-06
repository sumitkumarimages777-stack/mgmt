import { useQuery } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import { keys } from "../../api";
import { meets } from "../../lib/access";
import { supabase } from "../../lib/supabase";
import type { AccessLevel, Profile } from "../../lib/types";
import { AuthContext, type AuthState } from "./AuthContext";
import { useSession } from "./useSession";

async function loadMe(userId: string) {
  const [profile, perms, admin] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.rpc("my_permissions"),
    supabase.rpc("is_admin"),
  ]);
  if (profile.error) throw profile.error;
  if (perms.error) throw perms.error;
  if (admin.error) throw admin.error;
  return {
    profile: profile.data as Profile,
    permissions: (perms.data ?? []) as Array<{ permission_key: string; level: AccessLevel }>,
    isAdmin: admin.data === true,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;
  const me = useQuery({ queryKey: [...keys.me, userId], enabled: !!userId, queryFn: () => loadMe(userId!) });

  const value = useMemo<AuthState>(() => {
    const permissions = new Map((me.data?.permissions ?? []).map((p) => [p.permission_key, p.level]));
    return {
      session,
      loading: sessionLoading || (!!userId && me.isLoading),
      profile: me.data?.profile ?? null,
      isAdmin: me.data?.isAdmin ?? false,
      permissions,
      can: (key, level = "view") => meets(permissions.get(key), level),
      signOut: async () => {
        await supabase.auth.signOut();
      },
    };
  }, [session, sessionLoading, userId, me.data, me.isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
