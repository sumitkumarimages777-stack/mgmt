import { useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { AreaTag, Empty, ErrorBox, Icon, Loading, Modal } from "../../components/ui";
import { keys, useAreaMembers, useLookups, useProfiles, useWrite } from "../../lib/api";
import { adminUsers, supabase } from "../../lib/supabase";
import { ROLE_LABEL, type Area, type AreaPermission, type Profile, type UserRole } from "../../lib/types";

type Access = Record<string, AreaPermission | "none">;

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

const ROLE_HELP: Record<UserRole, string> = {
  admin: "Full access to everything, including people & areas.",
  staff: "Your own team. Sees only the areas you tick below.",
  external: "CA, lawyer or other outside advisor. Sees only the areas you tick below.",
};

export function UsersPage() {
  const profiles = useProfiles();
  const members = useAreaMembers();
  const { areas, areaById } = useLookups();
  const [editing, setEditing] = useState<Profile | null>(null);
  const [adding, setAdding] = useState(false);

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
        ) : (profiles.data ?? []).length === 0 ? (
          <Empty title="No people yet" />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Role</th>
                  <th>Access</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(profiles.data ?? []).map((p) => (
                  <tr key={p.id} className="clickable" onClick={() => setEditing(p)}>
                    <td>
                      <div className="cell-title">{p.full_name || "—"}</div>
                      <div className="cell-sub">{p.email}{p.organization ? ` · ${p.organization}` : ""}</div>
                    </td>
                    <td className="nowrap">{ROLE_LABEL[p.role]}</td>
                    <td>
                      {p.role === "admin" ? (
                        <span className="muted">All areas</span>
                      ) : accessOf(p.id).length === 0 ? (
                        <span className="badge badge-amber">No access yet</span>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
                          {accessOf(p.id).map((m) => (
                            <span key={m.area_id} className="nowrap">
                              <AreaTag area={areaById.get(m.area_id)} />
                              <span className="faint small"> ({m.permission})</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      {p.is_active ? <span className="badge badge-green">Active</span> : <span className="badge badge-gray">Deactivated</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

function AccessEditor({ areas, value, onChange }: { areas: Area[]; value: Access; onChange: (v: Access) => void }) {
  return (
    <table className="access-grid card">
      <tbody>
        {areas.map((a) => {
          const v = value[a.id] ?? "none";
          return (
            <tr key={a.id}>
              <td><AreaTag area={a} /></td>
              <td style={{ textAlign: "right" }}>
                <div className="seg">
                  {(["none", "view", "edit"] as const).map((opt) => (
                    <button key={opt} type="button" className={v === opt ? "on" : ""} onClick={() => onChange({ ...value, [a.id]: opt })}>
                      {opt === "none" ? "No access" : opt === "view" ? "View" : "Edit"}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function AddPersonModal({ areas, onClose }: { areas: Area[]; onClose: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState<UserRole>("external");
  const [password, setPassword] = useState(generatePassword);
  const [access, setAccess] = useState<Access>({});
  const [done, setDone] = useState(false);

  const create = useWrite(
    () =>
      adminUsers({
        action: "create_user",
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        organization: organization.trim() || null,
        role,
        access: Object.entries(access).filter(([, p]) => p !== "none").map(([area_id, permission]) => ({ area_id, permission })),
      }),
    [keys.profiles, keys.members],
  );

  if (done) {
    const text = `Login: ${window.location.origin}\nEmail: ${email.trim()}\nTemporary password: ${password}\n\nPlease change your password after signing in (click your name at the bottom-left).`;
    return (
      <Modal title="Person added" onClose={onClose} footer={<button className="btn btn-primary" onClick={onClose}>Done</button>}>
        <div className="form">
          <div className="alert alert-ok">{fullName || email} can now sign in. Send them these details privately (e.g. WhatsApp):</div>
          <textarea className="textarea" readOnly value={text} style={{ minHeight: 120 }} onFocus={(e) => e.target.select()} />
          <div>
            <button className="btn btn-sm" onClick={() => navigator.clipboard?.writeText(text)}>Copy</button>
          </div>
          <p className="faint small" style={{ margin: 0 }}>This password is not shown again. You can reset it later from this page.</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      wide
      title="Add person"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!email.trim() || password.length < 8 || create.isPending}
            onClick={() => create.mutate(undefined, { onSuccess: () => setDone(true) })}
          >
            {create.isPending ? "Creating…" : "Create login"}
          </button>
        </>
      }
    >
      <div className="form">
        <div className="form-row">
          <label className="field">
            <span>Name</span>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. CA Rakesh Sharma" />
          </label>
          <label className="field">
            <span>Email</span>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span>Firm / organisation</span>
            <input className="input" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="e.g. Sharma & Associates" />
          </label>
          <label className="field">
            <span>Role</span>
            <select className="select" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
            <small>{ROLE_HELP[role]}</small>
          </label>
        </div>
        <label className="field">
          <span>Temporary password</span>
          <div className="actions" style={{ flexWrap: "nowrap" }}>
            <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="btn" onClick={() => setPassword(generatePassword())}>New</button>
          </div>
        </label>
        {role !== "admin" && (
          <div className="field">
            <span>Area access</span>
            <AccessEditor areas={areas} value={access} onChange={setAccess} />
          </div>
        )}
        <ErrorBox error={create.error} />
      </div>
    </Modal>
  );
}

function EditPersonModal({
  person, areas, initialAccess, onClose,
}: { person: Profile; areas: Area[]; initialAccess: Access; onClose: () => void }) {
  const { profile: me } = useAuth();
  const [fullName, setFullName] = useState(person.full_name);
  const [organization, setOrganization] = useState(person.organization ?? "");
  const [role, setRole] = useState<UserRole>(person.role);
  const [access, setAccess] = useState<Access>(initialAccess);
  const [newPassword, setNewPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const isMe = person.id === me?.id;

  const save = useWrite(async () => {
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), organization: organization.trim() || null, role })
      .eq("id", person.id);
    if (error) throw error;
    const remove = areas.filter((a) => (access[a.id] ?? "none") === "none").map((a) => a.id);
    const upsert = Object.entries(access)
      .filter(([, p]) => p !== "none")
      .map(([area_id, permission]) => ({ area_id, user_id: person.id, permission }));
    if (remove.length) {
      const { error: e1 } = await supabase.from("area_members").delete().eq("user_id", person.id).in("area_id", remove);
      if (e1) throw e1;
    }
    if (upsert.length) {
      const { error: e2 } = await supabase.from("area_members").upsert(upsert);
      if (e2) throw e2;
    }
  }, [keys.profiles, keys.members, ["me"]]);

  const toggleActive = useWrite(
    () => adminUsers({ action: "set_active", user_id: person.id, active: !person.is_active }),
    [keys.profiles],
  );
  const resetPassword = useWrite(
    (password: string) => adminUsers({ action: "set_password", user_id: person.id, password }),
    [],
  );

  return (
    <Modal
      wide
      title={person.full_name || person.email}
      onClose={onClose}
      footer={
        <>
          {!isMe && (
            <button
              className={`btn${person.is_active ? " btn-danger" : ""}`}
              disabled={toggleActive.isPending}
              onClick={() => {
                if (!person.is_active || confirm(`Deactivate ${person.full_name || person.email}? They will be signed out and lose all access.`)) {
                  toggleActive.mutate(undefined, { onSuccess: onClose });
                }
              }}
            >
              {person.is_active ? "Deactivate" : "Reactivate"}
            </button>
          )}
          <span className="spacer" />
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={save.isPending} onClick={() => save.mutate(undefined, { onSuccess: onClose })}>
            {save.isPending ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <div className="form">
        <p className="muted" style={{ margin: 0 }}>{person.email}</p>
        <div className="form-row">
          <label className="field">
            <span>Name</span>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </label>
          <label className="field">
            <span>Firm / organisation</span>
            <input className="input" value={organization} onChange={(e) => setOrganization(e.target.value)} />
          </label>
        </div>
        <label className="field">
          <span>Role</span>
          <select className="select" value={role} onChange={(e) => setRole(e.target.value as UserRole)} disabled={isMe}>
            {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
          <small>{isMe ? "You can't change your own role." : ROLE_HELP[role]}</small>
        </label>
        {role !== "admin" && (
          <div className="field">
            <span>Area access</span>
            <AccessEditor areas={areas} value={access} onChange={setAccess} />
          </div>
        )}
        <ErrorBox error={save.error ?? toggleActive.error} />

        <div className="section-title" style={{ marginTop: 6 }}>Reset password</div>
        <div className="actions" style={{ flexWrap: "nowrap" }}>
          <input className="input" placeholder="New password (min 8 characters)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <button type="button" className="btn" onClick={() => setNewPassword(generatePassword())}>Generate</button>
          <button
            type="button"
            className="btn"
            disabled={newPassword.length < 8 || resetPassword.isPending}
            onClick={() =>
              resetPassword.mutate(newPassword, {
                onSuccess: () => setNotice(`Password changed. Send ${person.email} the new password: ${newPassword}`),
              })
            }
          >
            Set
          </button>
        </div>
        {notice && <div className="alert alert-ok">{notice}</div>}
        <ErrorBox error={resetPassword.error} />
      </div>
    </Modal>
  );
}
