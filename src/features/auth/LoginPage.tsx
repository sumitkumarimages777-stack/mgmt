import { useState, type FormEvent } from "react";
import { adminUsers } from "../../api";
import { ErrorBox } from "../../components/ui";
import { supabase } from "../../lib/supabase";
import { useSetupRequired } from "./useSetupRequired";

export function LoginPage() {
  const setup = useSetupRequired();
  const [mode, setMode] = useState<"signin" | "setup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const canSetup = setup.data === true;
  const isSetup = canSetup && mode === "setup";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (isSetup) await adminUsers.bootstrap(email, password, fullName);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="card auth-card form" onSubmit={submit}>
        <div>
          <div className="brand" style={{ padding: "0 0 14px" }}>
            <div className="brand-mark">M</div>
            Management Panel
          </div>
          <h1>{isSetup ? "Create the admin account" : "Sign in"}</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            {isSetup
              ? "This is a one-time setup. You'll then add your CA, lawyer and team from inside the panel."
              : "Use the email and password your admin gave you."}
          </p>
        </div>
        {isSetup && (
          <label className="field">
            <span>Your name</span>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </label>
        )}
        <label className="field">
          <span>Email</span>
          <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            className="input"
            type="password"
            autoComplete={isSetup ? "new-password" : "current-password"}
            minLength={isSetup ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {isSetup && <small>At least 8 characters.</small>}
        </label>
        <ErrorBox error={error} />
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "Please wait…" : isSetup ? "Create admin & sign in" : "Sign in"}
        </button>
        {canSetup && (
          <button type="button" className="btn btn-ghost btn-block" onClick={() => setMode(isSetup ? "signin" : "setup")}>
            {isSetup ? "I already have an account" : "First time? Set up the admin account"}
          </button>
        )}
      </form>
    </div>
  );
}
