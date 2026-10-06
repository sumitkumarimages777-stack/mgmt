import { useState } from "react";
import { keys, updateProfile, useWrite } from "../../api";
import { ErrorBox } from "../../components/ui";
import type { Profile } from "../../lib/types";

export function NameCard({ profile, onSaved }: { profile: Profile; onSaved: (msg: string) => void }) {
  const [name, setName] = useState(profile.full_name);
  const save = useWrite(() => updateProfile(profile.id, { full_name: name.trim() }), [keys.me, keys.profiles]);
  return (
    <div className="card card-pad form" style={{ marginBottom: 16 }}>
      <h2>Name</h2>
      <div className="actions" style={{ flexWrap: "nowrap" }}>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn" disabled={!name.trim() || save.isPending} onClick={() => save.mutate(undefined, { onSuccess: () => onSaved("Name saved.") })}>
          Save
        </button>
      </div>
      <ErrorBox error={save.error} />
    </div>
  );
}
