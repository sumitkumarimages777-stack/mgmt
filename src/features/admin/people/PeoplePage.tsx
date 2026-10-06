import { useState } from "react";
import { useProfiles, useRoles, useUserRoles } from "../../../api";
import { Empty, Icon, Loading } from "../../../components/ui";
import type { Profile, Role } from "../../../lib/types";
import { AddPersonModal } from "./AddPersonModal";
import { EditPersonModal } from "./EditPersonModal";
import { PeopleTable } from "./PeopleTable";

export function PeoplePage() {
  const profiles = useProfiles();
  const roles = useRoles();
  const userRoles = useUserRoles();
  const [editing, setEditing] = useState<Profile | null>(null);
  const [adding, setAdding] = useState(false);
  const allRoles = roles.data?.roles ?? [];
  const roleIdsOf = (userId: string) => (userRoles.data ?? []).filter((u) => u.user_id === userId).map((u) => u.role_id);
  const rolesOf = (userId: string): Role[] => allRoles.filter((r) => roleIdsOf(userId).includes(r.id));
  const people = profiles.data ?? [];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>People</h1>
          <p>Give your CA, lawyer, team or employees a login and choose their roles.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setAdding(true)}>
          <Icon name="plus" size={16} /> Add person
        </button>
      </div>

      <div className="card">
        {profiles.isLoading || userRoles.isLoading ? (
          <Loading />
        ) : people.length === 0 ? (
          <Empty title="No people yet" />
        ) : (
          <PeopleTable people={people} rolesOf={rolesOf} onOpen={setEditing} />
        )}
      </div>

      {adding && <AddPersonModal roles={allRoles} onClose={() => setAdding(false)} />}
      {editing && (
        <EditPersonModal person={editing} roles={allRoles} initialRoleIds={roleIdsOf(editing.id)} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
