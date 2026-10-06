import { useState } from "react";
import { adminUsers, useWrite } from "../../../api";
import { ErrorBox } from "../../../components/ui";
import type { Profile } from "../../../lib/types";
import { generatePassword } from "./password";

export function ResetPasswordSection({ person }: { person: Profile }) {
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const reset = useWrite((pw: string) => adminUsers.setPassword(person.id, pw), []);

  const submit = () =>
    reset.mutate(password, { onSuccess: () => setNotice(`Password changed. Send ${person.email} the new password: ${password}`) });

  return (
    <>
      <div className="section-title" style={{ marginTop: 6 }}>Reset password</div>
      <div className="actions" style={{ flexWrap: "nowrap" }}>
        <input className="input" placeholder="New password (min 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="button" className="btn" onClick={() => setPassword(generatePassword())}>Generate</button>
        <button type="button" className="btn" disabled={password.length < 8 || reset.isPending} onClick={submit}>Set</button>
      </div>
      {notice && <div className="alert alert-ok">{notice}</div>}
      <ErrorBox error={reset.error} />
    </>
  );
}
