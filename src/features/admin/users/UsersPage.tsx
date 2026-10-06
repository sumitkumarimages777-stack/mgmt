import { useState } from "react";
import { useAreaMembers, useLookups, useProfiles } from "../../../api";
import { Empty, Icon, Loading } from "../../../components/ui";
import type { Profile } from "../../../lib/types";
import { AddPersonModal } from "./AddPersonModal";
import { EditPersonModal } from "./EditPersonModal";
import { PeopleTable } from "./PeopleTable";

export function UsersPage() {
  const profiles = useProfiles();
  const members = useAreaMembers();
  const { areas } = useLookups();
  const [editing, setEditing] = useState<Profile | null>(null);
  const [adding, setAdding] = useState(false);
  const people = profiles.data ?? [];
  const accessOf = (userId: string) => (members.data ?? []).filter((m) => m.user_id === userId);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>People & access</h1>
          <p>Give your CA, lawyer or team a login and choose which areas each person can see or edit.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setAdding(true)}>
          <Icon name="plus" size={16} /> Add person
        </button>
      </div>

      <div className="card">
        {profiles.isLoading || members.isLoading ? (
          <Loading />
        ) : people.length === 0 ? (
          <Empty title="No people yet" />
        ) : (
          <PeopleTable people={people} members={members.data ?? []} onOpen={setEditing} />
        )}
      </div>

      <p className="faint small" style={{ marginTop: 12 }}>
        <strong>View</strong> = can see filings, requests and documents in that area, and comment.{" "}
        <strong>Edit</strong> = can also add filings, request and upload documents, and change statuses.
      </p>

      {adding && <AddPersonModal areas={areas} onClose={() => setAdding(false)} />}
      {editing && (
        <EditPersonModal
          person={editing}
          areas={areas}
          initialAccess={Object.fromEntries(accessOf(editing.id).map((m) => [m.area_id, m.permission]))}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
