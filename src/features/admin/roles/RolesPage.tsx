import { useState } from "react";
import { usePermissionCatalog, useRoles, useUserRoles, type GrantMap } from "../../../api";
import { Empty, Icon, Loading } from "../../../components/ui";
import { ACCESS_LABEL } from "../../../lib/labels";
import type { Role } from "../../../lib/types";
import { RoleModal } from "./RoleModal";

export function RolesPage() {
  const roles = useRoles();
  const userRoles = useUserRoles();
  const catalog = usePermissionCatalog();
  const [editing, setEditing] = useState<Role | "new" | null>(null);

  const grantsOf = (roleId: string): GrantMap =>
    Object.fromEntries((roles.data?.grants ?? []).filter((g) => g.role_id === roleId).map((g) => [g.permission_key, g.level]));
  const peopleCount = (roleId: string) => (userRoles.data ?? []).filter((u) => u.role_id === roleId).length;
  const labelOf = (key: string) => catalog.data?.find((p) => p.key === key)?.label ?? key;
  const summary = (role: Role) => {
    if (role.is_superuser) return "Everything, including people and roles";
    const grants = Object.entries(grantsOf(role.id));
    return grants.length ? grants.map(([k, l]) => `${labelOf(k)}: ${ACCESS_LABEL[l]}`).join(" · ") : "No access yet";
  };
  const list = roles.data?.roles ?? [];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Roles & permissions</h1>
          <p>Create roles like “CA”, “CA Assistant”, “Lawyer” or “HR Intern” and choose exactly what each can see and do.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing("new")}>
          <Icon name="plus" size={16} /> New role
        </button>
      </div>
      <div className="card">
        {roles.isLoading ? (
          <Loading />
        ) : list.length === 0 ? (
          <Empty title="No roles yet" />
        ) : (
          <ul className="list">
            {list.map((r) => (
              <li key={r.id} className={`list-item${r.is_superuser ? "" : " clickable"}`} onClick={() => !r.is_superuser && setEditing(r)}>
                <div className="grow">
                  <div className="cell-title">{r.name}{r.is_superuser && <span className="badge badge-blue" style={{ marginLeft: 8 }}>Built-in</span>}</div>
                  <div className="cell-sub">{r.description}</div>
                  <div className="cell-sub">{summary(r)}</div>
                </div>
                <span className="muted small nowrap">{peopleCount(r.id)} {peopleCount(r.id) === 1 ? "person" : "people"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {editing && (
        <RoleModal
          role={editing === "new" ? undefined : editing}
          initialGrants={editing === "new" ? {} : grantsOf(editing.id)}
          peopleCount={editing === "new" ? 0 : peopleCount(editing.id)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
