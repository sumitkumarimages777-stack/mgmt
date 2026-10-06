import { useState } from "react";
import { keys, updateProfile, useLookups, useWrite } from "../../api";
import { AreaTag, ErrorBox } from "../../components/ui";
import { ROLE_LABEL } from "../../lib/labels";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../auth/AuthContext";

export function AccountPage() {
  const { profile, isAdmin, permissions } = useAuth();
  const { areaById } = useLookups();
  const [name, setName] = useState(profile?.full_name ?? "");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const saveName = useWrite(() => updateProfile(profile!.id, { full_name: name.trim() }), [keys.me, keys.profiles]);

  const changePassword = useWrite(async () => {
    if (password !== confirmPw) throw new Error("The two passwords don't match");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  if (!profile) return null;

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <div className="page-head">
        <div>
          <h1>My account</h1>
          <p>{profile.email} · {ROLE_LABEL[profile.role]}{profile.organization ? ` · ${profile.organization}` : ""}</p>
        </div>
      </div>

      <div className="card card-pad form" style={{ marginBottom: 16 }}>
        <h2>Name</h2>
        <div className="actions" style={{ flexWrap: "nowrap" }}>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn" disabled={!name.trim() || saveName.isPending} onClick={() => saveName.mutate(undefined, { onSuccess: () => setMsg("Name saved.") })}>
            Save
          </button>
        </div>
        <ErrorBox error={saveName.error} />
      </div>

      <div className="card card-pad form" style={{ marginBottom: 16 }}>
        <h2>Change password</h2>
        <div className="form-row">
          <input className="input" type="password" autoComplete="new-password" placeholder="New password (min 8)" value={password} onChange={(e) => setPassword(e.target.value)} />
          <input className="input" type="password" autoComplete="new-password" placeholder="Repeat new password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
        </div>
        <div>
          <button
            className="btn btn-primary"
            disabled={password.length < 8 || changePassword.isPending}
            onClick={() =>
              changePassword.mutate(undefined, {
                onSuccess: () => { setPassword(""); setConfirmPw(""); setMsg("Password changed."); },
              })
            }
          >
            Change password
          </button>
        </div>
        <ErrorBox error={changePassword.error} />
      </div>
      {msg && <div className="alert alert-ok" style={{ marginBottom: 16 }}>{msg}</div>}

      <div className="card card-pad">
        <h2 style={{ marginBottom: 10 }}>My access</h2>
        {isAdmin ? (
          <p className="muted" style={{ margin: 0 }}>You are an admin and can see and edit every area.</p>
        ) : permissions.size === 0 ? (
          <p className="muted" style={{ margin: 0 }}>No areas yet — ask the admin to give you access.</p>
        ) : (
          <ul className="list">
            {[...permissions.entries()].map(([areaId, p]) => (
              <li key={areaId} className="list-item" style={{ padding: "8px 0" }}>
                <div className="grow"><AreaTag area={areaById.get(areaId)} /></div>
                <span className="badge badge-gray">{p === "edit" ? "Can edit" : "View only"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
