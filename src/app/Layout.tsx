import { Suspense, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Icon, Loading } from "../components/ui";
import { Sidebar } from "./Sidebar";

export function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // close the mobile drawer on navigation
  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setOpen(false);
  }

  return (
    <div className="shell">
      <Sidebar open={open} />
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <div className="main">
        <div className="topbar-mobile">
          <button className="icon-btn" onClick={() => setOpen(true)} aria-label="Open menu">
            <Icon name="menu" />
          </button>
          <strong>Management Panel</strong>
        </div>
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
