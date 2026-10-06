import type { Session } from "@supabase/supabase-js";
import { createContext, useContext } from "react";
import type { AccessLevel, Profile } from "../../lib/types";

export interface AuthState {
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  /** Holds the Admin role: everything, including people and roles. */
  isAdmin: boolean;
  /** permission key ("ca.filings") -> effective level across all the user's roles. */
  permissions: Map<string, AccessLevel>;
  /** Does the user have at least `level` on `key`? */
  can: (key: string, level?: AccessLevel) => boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
