import type { ReactNode } from "react";
import { Empty } from "../components/ui";
import { useAuth } from "../features/auth/AuthContext";

/** Shows the page only if the user has `perm` (or is admin when perm is "admin"). */
export function RequirePerm({ perm, children }: { perm: string; children: ReactNode }) {
  const { can, isAdmin } = useAuth();
  const allowed = perm === "admin" ? isAdmin : can(perm);
  if (allowed) return <>{children}</>;
  return (
    <div className="page">
      <div className="card">
        <Empty title="You don't have access to this page">Ask the admin to add it to one of your roles.</Empty>
      </div>
    </div>
  );
}
