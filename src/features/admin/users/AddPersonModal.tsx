import { useState } from "react";
import { adminUsers, keys, useWrite, type AccessMap } from "../../../api";
import { ErrorBox, Modal } from "../../../components/ui";
import type { Area, AreaPermission, UserRole } from "../../../lib/types";
import { AccessEditor } from "./AccessEditor";
import { generatePassword } from "./password";
import { PersonCreatedNotice } from "./PersonCreatedNotice";
import { RoleField } from "./RoleField";

const toAccessList = (access: AccessMap) =>
  Object.entries(access)
    .filter((e): e is [string, AreaPermission] => e[1] !== "none")
    .map(([area_id, permission]) => ({ area_id, permission }));

export function AddPersonModal({ areas, onClose }: { areas: Area[]; onClose: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState<UserRole>("external");
  const [password, setPassword] = useState(generatePassword);
  const [access, setAccess] = useState<AccessMap>({});
  const [done, setDone] = useState(false);

  const create = useWrite(
    () =>
      adminUsers.createUser({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        organization: organization.trim() || null,
        role,
        access: toAccessList(access),
      }),
    [keys.profiles, keys.members],
  );

  if (done) return <PersonCreatedNotice name={fullName} email={email.trim()} password={password} onClose={onClose} />;

  const footer = (
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
  );

  return (
    <Modal wide title="Add person" onClose={onClose} footer={footer}>
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
          <RoleField value={role} onChange={setRole} />
        </div>
        <label className="field">
          <span>Temporary password</span>
          <div className="actions" style={{ flexWrap: "nowrap" }}>
            <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="btn" onClick={() => setPassword(generatePassword())}>New</button>
          </div>
        </label>
        {role !== "admin" && <AccessEditor areas={areas} value={access} onChange={setAccess} />}
        <ErrorBox error={create.error} />
      </div>
    </Modal>
  );
}
