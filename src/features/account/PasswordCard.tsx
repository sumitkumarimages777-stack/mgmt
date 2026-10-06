import { useState } from "react";
import { useWrite } from "../../api";
import { ErrorBox } from "../../components/ui";
import { supabase } from "../../lib/supabase";

export function PasswordCard({ onSaved }: { onSaved: (msg: string) => void }) {
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const change = useWrite(async () => {
    if (password !== confirmPw) throw new Error("The two passwords don't match");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const submit = () =>
    change.mutate(undefined, {
      onSuccess: () => {
        setPassword("");
        setConfirmPw("");
        onSaved("Password changed.");
      },
    });

  return (
    <div className="card card-pad form" style={{ marginBottom: 16 }}>
      <h2>Change password</h2>
      <div className="form-row">
        <input className="input" type="password" autoComplete="new-password" placeholder="New password (min 8)" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input className="input" type="password" autoComplete="new-password" placeholder="Repeat new password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
      </div>
      <div>
        <button className="btn btn-primary" disabled={password.length < 8 || change.isPending} onClick={submit}>Change password</button>
      </div>
      <ErrorBox error={change.error} />
    </div>
  );
}
