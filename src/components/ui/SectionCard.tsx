import type { ReactNode } from "react";
import { Link } from "react-router-dom";

/** Card with a title row, an optional "→" link or extra content on the right, and a body. */
export function SectionCard({ title, link, aside, children }: {
  title: string;
  link?: { to: string; label: string };
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="card">
      <div className="card-head">
        <h2>{title}</h2>
        {link && <Link to={link.to} className="small">{link.label} →</Link>}
        {aside}
      </div>
      {children}
    </div>
  );
}
