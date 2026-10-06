import type { Session } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { AreaMember, AreaPermission, Profile } from "../lib/types";

interface AuthState {
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  isAdmin: boolean;
  /** area_id -> permission for the signed-in user (admins have edit everywhere). */
  permissions: Map<string, AreaPermission>;
  canView: (areaId: string) => boolean;
  canEdit: (areaId: string) => boolean;
  /** Can the user edit in at least one area? */
  canEditAny: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "SIGNED_OUT" || event === "SIGNED_IN") queryClient.clear();
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  const userId = session?.user.id;

  const profileQuery = useQuery({
    queryKey: ["me", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [{ data: profile, error }, { data: members, error: mErr }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId!).single(),
        supabase.from("area_members").select("area_id, user_id, permission").eq("user_id", userId!),
      ]);
      if (error) throw error;
      if (mErr) throw mErr;
      return { profile: profile as Profile, members: (members ?? []) as AreaMember[] };
    },
  });

  const value = useMemo<AuthState>(() => {
    const profile = profileQuery.data?.profile ?? null;
    const isAdmin = profile?.role === "admin" && profile.is_active;
    const permissions = new Map<string, AreaPermission>();
    for (const m of profileQuery.data?.members ?? []) permissions.set(m.area_id, m.permission);
    const active = !!profile?.is_active;
    return {
      session,
      loading: sessionLoading || (!!userId && profileQuery.isLoading),
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
  }, [session, sessionLoading, userId, profileQuery.data, profileQuery.isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
