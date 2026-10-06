import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { MyAccessCard } from "./MyAccessCard";
import { NameCard } from "./NameCard";
import { PasswordCard } from "./PasswordCard";

export function AccountPage() {
  const { profile } = useAuth();
  const [msg, setMsg] = useState<string | null>(null);
  if (!profile) return null;

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <div className="page-head">
        <div>
          <h1>My account</h1>
          <p>{profile.email}{profile.organization ? ` · ${profile.organization}` : ""}</p>
        </div>
      </div>
      <NameCard profile={profile} onSaved={setMsg} />
      <PasswordCard onSaved={setMsg} />
      {msg && <div className="alert alert-ok" style={{ marginBottom: 16 }}>{msg}</div>}
      <MyAccessCard />
    </div>
  );
}
