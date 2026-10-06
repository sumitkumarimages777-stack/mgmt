import { useState } from "react";
import { ErrorBox, Modal } from "../../../components/ui";
import type { Profile, Role } from "../../../lib/types";
import { useAuth } from "../../auth/AuthContext";
import { ResetPasswordSection } from "./ResetPasswordSection";
import { RolePicker } from "./RolePicker";
import { useSavePerson, useToggleActive } from "./useSavePerson";

interface Props {
  person: Profile;
  roles: Role[];
  initialRoleIds: string[];
  onClose: () => void;
}

export function EditPersonModal({ person, roles, initialRoleIds, onClose }: Props) {
  const { profile: me } = useAuth();
  const isMe = person.id === me?.id;
  const [email, setEmail] = useState(person.email);
  const [fullName, setFullName] = useState(person.full_name);
  const [organization, setOrganization] = useState(person.organization ?? "");
  const [roleIds, setRoleIds] = useState(initialRoleIds);
  const save = useSavePerson(person, initialRoleIds);
  // You can't take Admin away from yourself (someone else must do it).
  const lockedForMe = isMe ? roles.filter((r) => r.is_superuser && initialRoleIds.includes(r.id)).map((r) => r.id) : [];
  const toggleActive = useToggleActive(person);
  const emailChanged = email.trim().toLowerCase() !== person.email;
  const name = person.full_name || person.email;

  const confirmToggle = () => {
    if (!person.is_active || confirm(`Deactivate ${name}? They will be signed out and lose all access.`)) {
      toggleActive.mutate(undefined, { onSuccess: onClose });
    }
  };
  const submit = () => save.mutate({ email, fullName, organization, roleIds }, { onSuccess: onClose });

  const footer = (
    <>
      {!isMe && (
        <button className={`btn${person.is_active ? " btn-danger" : ""}`} disabled={toggleActive.isPending} onClick={confirmToggle}>
          {person.is_active ? "Deactivate" : "Reactivate"}
        </button>
      )}
      <span className="spacer" />
      <button className="btn" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" disabled={save.isPending || !email.trim()} onClick={submit}>
        {save.isPending ? "Saving…" : "Save"}
      </button>
    </>
  );

  return (
    <Modal wide title={name} onClose={onClose} footer={footer}>
      <div className="form">
        <label className="field">
          <span>Login email</span>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {emailChanged && (
            <small>{isMe ? "You" : "They"} will sign in with the new email from now on. The password stays the same.</small>
          )}
        </label>
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
        <RolePicker roles={roles} value={roleIds} onChange={setRoleIds} locked={lockedForMe} />
        <ErrorBox error={save.error ?? toggleActive.error} />
        <ResetPasswordSection person={person} />
      </div>
    </Modal>
  );
}
