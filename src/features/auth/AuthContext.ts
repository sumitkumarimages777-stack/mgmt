import type { Session } from "@supabase/supabase-js";
import { createContext, useContext } from "react";
import type { AreaPermission, Profile } from "../../lib/types";

export interface AuthState {
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

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
