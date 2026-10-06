import { useState } from "react";
import { useActivity, useLookups } from "../../api";
import { Empty, Loading, Tag } from "../../components/ui";
import { formatDateTime } from "../../lib/dates";
import { MODULE_LABEL } from "../../lib/labels";
import type { ModuleKey } from "../../lib/types";
import { usePermLabel } from "./usePermLabel";

export function ActivityPage() {
  const [limit, setLimit] = useState(200);
  const activity = useActivity(limit);
  const { personName } = useLookups();
  const permLabel = usePermLabel();
  const [module, setModule] = useState("");
  const rows = (activity.data ?? []).filter((a) => !module || a.perm_key?.startsWith(`${module}.`));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Activity</h1>
          <p>An automatic audit trail: who added, filed, requested or shared what, and when. You see entries for the parts of the panel you have access to.</p>
        </div>
      </div>
      <div className="toolbar">
        <select className="select" value={module} onChange={(e) => setModule(e.target.value)}>
          <option value="">All departments</option>
          {(Object.keys(MODULE_LABEL) as ModuleKey[]).map((m) => <option key={m} value={m}>{MODULE_LABEL[m]}</option>)}
        </select>
      </div>
      <div className="card">
        {activity.isLoading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <Empty title="No activity yet" />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Who</th>
                  <th>What</th>
                  <th>Where</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td className="nowrap">{formatDateTime(a.created_at)}</td>
                    <td className="nowrap">{personName(a.actor_id)}</td>
                    <td>{a.summary}</td>
                    <td><Tag>{permLabel(a.perm_key)}</Tag></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {(activity.data ?? []).length >= limit && (
        <div style={{ marginTop: 12 }}>
          <button className="btn" onClick={() => setLimit((l) => l + 200)}>Load more</button>
        </div>
      )}
    </div>
  );
}
