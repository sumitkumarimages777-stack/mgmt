import { Tag } from "../../components/ui";
import { ACCESS_LABEL } from "../../lib/labels";
import { useAuth } from "../auth/AuthContext";
import { usePermLabel } from "../activity/usePermLabel";

export function MyAccessCard() {
  const { isAdmin, permissions } = useAuth();
  const permLabel = usePermLabel();
  return (
    <div className="card card-pad">
      <h2 style={{ marginBottom: 10 }}>My access</h2>
      {isAdmin ? (
        <p className="muted" style={{ margin: 0 }}>You are an admin and can see and change everything.</p>
      ) : permissions.size === 0 ? (
        <p className="muted" style={{ margin: 0 }}>No access yet — ask the admin to give you a role.</p>
      ) : (
        <ul className="list">
          {[...permissions.entries()].map(([key, level]) => (
            <li key={key} className="list-item" style={{ padding: "8px 0" }}>
              <div className="grow"><Tag>{permLabel(key)}</Tag></div>
              <span className="badge badge-gray">{ACCESS_LABEL[level]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
