import { useState } from "react";
import { adminUsers, keys, useWrite } from "../../../api";
import { ErrorBox, Modal } from "../../../components/ui";
import type { Role } from "../../../lib/types";
import { generatePassword } from "./password";
import { PersonCreatedNotice } from "./PersonCreatedNotice";
import { RolePicker } from "./RolePicker";

export function AddPersonModal({ roles, onClose }: { roles: Role[]; onClose: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [password, setPassword] = useState(generatePassword);
  const [done, setDone] = useState(false);

  const create = useWrite(
    () =>
      adminUsers.createUser({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        organization: organization.trim() || null,
        role_ids: roleIds,
      }),
    [keys.profiles, keys.userRoles],
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
        <label className="field">
          <span>Firm / organisation</span>
          <input className="input" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="e.g. Sharma & Associates" />
        </label>
        <label className="field">
          <span>Temporary password</span>
          <div className="actions" style={{ flexWrap: "nowrap" }}>
            <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="btn" onClick={() => setPassword(generatePassword())}>New</button>
          </div>
        </label>
        <RolePicker roles={roles} value={roleIds} onChange={setRoleIds} />
        <ErrorBox error={create.error} />
      </div>
    </Modal>
  );
}
