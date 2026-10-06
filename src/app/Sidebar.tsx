import { NavLink } from "react-router-dom";
import { useFilings, useRequests } from "../api";
import { Icon, type IconName } from "../components/ui";
import { useAuth } from "../features/auth/AuthContext";
import { filingDueState } from "../lib/dates";
import { ROLE_LABEL } from "../lib/labels";

function NavItem({ to, icon, label, count }: { to: string; icon: IconName; label: string; count?: number }) {
  return (
    <NavLink to={to} end={to === "/"} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
      <Icon name={icon} />
      {label}
      {!!count && <span className="nav-count">{count}</span>}
    </NavLink>
  );
}

export function Sidebar({ open }: { open: boolean }) {
  const { profile, isAdmin, signOut } = useAuth();
  const filings = useFilings();
  const requests = useRequests();
  const overdue = (filings.data ?? []).filter((f) => filingDueState(f) === "overdue").length;
  const toSend = (requests.data ?? []).filter((r) => r.status === "open" || r.status === "rejected").length;

  return (
    <aside className={`sidebar${open ? " open" : ""}`}>
      <div className="brand">
        <div className="brand-mark">M</div>
        Management Panel
      </div>
      <NavItem to="/" icon="home" label="Dashboard" />
      <NavItem to="/filings" icon="calendar" label="Filings" count={overdue} />
      <NavItem to="/requests" icon="inbox" label="Document requests" count={toSend} />
      <NavItem to="/documents" icon="file" label="Shared documents" />
      <NavItem to="/activity" icon="activity" label="Activity" />
      {isAdmin && (
        <>
          <div className="nav-section">Admin</div>
          <NavItem to="/admin/users" icon="users" label="People & access" />
          <NavItem to="/admin/areas" icon="layers" label="Areas" />
        </>
      )}
      <div className="sidebar-foot">
        <NavLink to="/account" className="nav-link" style={{ padding: 0 }}>
          <div style={{ minWidth: 0 }}>
            <div className="me-name">{profile?.full_name || profile?.email}</div>
            <div className="me-sub">
              {profile ? ROLE_LABEL[profile.role] : ""}
              {profile?.organization ? ` · ${profile.organization}` : ""}
            </div>
          </div>
        </NavLink>
        <button className="btn btn-sm" onClick={signOut}>
          <Icon name="logout" size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}
