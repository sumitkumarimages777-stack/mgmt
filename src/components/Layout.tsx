import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useFilings, useRequests } from "../lib/api";
import { filingDueState } from "../lib/dates";
import { ROLE_LABEL } from "../lib/types";
import { Icon } from "./ui";

export function Layout() {
  const { profile, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const filings = useFilings();
  const requests = useRequests();

  const overdue = (filings.data ?? []).filter((f) => filingDueState(f) === "overdue").length;
  const openRequests = (requests.data ?? []).filter((r) => r.status === "open" || r.status === "rejected").length;

  // close the mobile drawer on navigation
  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setOpen(false);
  }

  const link = (to: string, icon: string, label: string, count?: number) => (
    <NavLink to={to} end={to === "/"} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
      <Icon name={icon} />
      {label}
      {!!count && <span className="nav-count">{count}</span>}
    </NavLink>
  );

  return (
    <div className="shell">
      <aside className={`sidebar${open ? " open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">M</div>
          Management Panel
        </div>
        {link("/", "home", "Dashboard")}
        {link("/filings", "calendar", "Filings", overdue)}
        {link("/requests", "inbox", "Document requests", openRequests)}
        {link("/documents", "file", "Shared documents")}
        {link("/activity", "activity", "Activity")}
        {isAdmin && (
          <>
            <div className="nav-section">Admin</div>
            {link("/admin/users", "users", "People & access")}
            {link("/admin/areas", "layers", "Areas")}
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
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <div className="main">
        <div className="topbar-mobile">
          <button className="icon-btn" onClick={() => setOpen(true)} aria-label="Open menu">
            <Icon name="menu" />
          </button>
          <strong>Management Panel</strong>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
