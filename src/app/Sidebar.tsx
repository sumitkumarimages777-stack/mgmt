import { NavLink } from "react-router-dom";
import { Icon, type IconName } from "../components/ui";
import { useAuth } from "../features/auth/AuthContext";
import { NAV_SECTIONS } from "./navigation";
import { SidebarFooter } from "./SidebarFooter";
import { useNavBadges } from "./useNavBadges";

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
  const { isAdmin, can } = useAuth();
  const badges = useNavBadges();

  return (
    <aside className={`sidebar${open ? " open" : ""}`}>
      <div className="brand">
        <div className="brand-mark">M</div>
        Management Panel
      </div>
      <NavItem to="/" icon="home" label="Dashboard" />
      {NAV_SECTIONS.map((section) => {
        const items = section.items.filter((i) => can(i.perm));
        if (items.length === 0) return null;
        return (
          <div key={section.module}>
            <div className="nav-section">{section.label}</div>
            {items.map((i) => (
              <NavItem key={i.to} to={i.to} icon={i.icon} label={i.label} count={i.badge && badges[i.badge]} />
            ))}
          </div>
        );
      })}
      <div className="nav-section">General</div>
      <NavItem to="/activity" icon="activity" label="Activity" />
      {isAdmin && (
        <>
          <div className="nav-section">Admin</div>
          <NavItem to="/admin/people" icon="users" label="People" />
          <NavItem to="/admin/roles" icon="layers" label="Roles & permissions" />
        </>
      )}
      <SidebarFooter />
    </aside>
  );
}
