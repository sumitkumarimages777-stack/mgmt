import { useState } from "react";
import { deleteRole, keys, saveRole, usePermissionCatalog, useWrite, type GrantMap } from "../../../api";
import { ErrorBox, Loading, Modal } from "../../../components/ui";
import type { Role } from "../../../lib/types";
import { PermissionGrid } from "./PermissionGrid";

interface Props {
  role?: Role;
  initialGrants: GrantMap;
  peopleCount: number;
  onClose: () => void;
}

export function RoleModal({ role, initialGrants, peopleCount, onClose }: Props) {
  const catalog = usePermissionCatalog();
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [grants, setGrants] = useState<GrantMap>(initialGrants);
  const save = useWrite(
    () => saveRole(role?.id ?? null, { name: name.trim(), description: description.trim() || null, grants }),
    [keys.roles, keys.me],
  );
  const remove = useWrite(() => deleteRole(role!.id), [keys.roles, keys.userRoles, keys.me]);

  const confirmDelete = () => {
    const who = peopleCount ? ` ${peopleCount} ${peopleCount === 1 ? "person" : "people"} will lose it.` : "";
    if (confirm(`Delete role "${role!.name}"?${who}`)) remove.mutate(undefined, { onSuccess: onClose });
  };

  const footer = (
    <>
      {role && <button className="btn btn-ghost btn-danger" onClick={confirmDelete}>Delete</button>}
      <span className="spacer" />
      <button className="btn" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" disabled={!name.trim() || save.isPending} onClick={() => save.mutate(undefined, { onSuccess: onClose })}>
        {save.isPending ? "Saving…" : "Save"}
      </button>
    </>
  );

  return (
    <Modal wide title={role ? `Role: ${role.name}` : "New role"} onClose={onClose} footer={footer}>
      <div className="form">
        <div className="form-row">
          <label className="field">
            <span>Role name</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HR Intern" />
          </label>
          <label className="field">
            <span>Description</span>
            <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Who is this role for?" />
          </label>
        </div>
        <div className="field">
          <span>What this role can do</span>
          {catalog.isLoading ? <Loading /> : <PermissionGrid catalog={catalog.data ?? []} value={grants} onChange={setGrants} />}
          <small>Someone with several roles gets the highest level any of their roles gives.</small>
        </div>
        <ErrorBox error={save.error ?? remove.error} />
      </div>
    </Modal>
  );
}
