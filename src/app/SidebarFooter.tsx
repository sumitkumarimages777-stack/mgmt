import { NavLink } from "react-router-dom";
import { Icon } from "../components/ui";
import { useAuth } from "../features/auth/AuthContext";

export function SidebarFooter() {
  const { profile, isAdmin, signOut } = useAuth();
  return (
    <div className="sidebar-foot">
      <NavLink to="/account" className="nav-link" style={{ padding: 0 }}>
        <div style={{ minWidth: 0 }}>
          <div className="me-name">{profile?.full_name || profile?.email}</div>
          <div className="me-sub">
            {isAdmin ? "Admin" : "My account"}
            {profile?.organization ? ` · ${profile.organization}` : ""}
          </div>
        </div>
      </NavLink>
      <button className="btn btn-sm" onClick={signOut}>
        <Icon name="logout" size={16} /> Sign out
      </button>
    </div>
  );
}
