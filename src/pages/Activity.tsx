import { useState } from "react";
import { AreaTag, Empty, Loading } from "../components/ui";
import { useActivity, useLookups } from "../lib/api";
import { formatDateTime } from "../lib/dates";

export function ActivityPage() {
  const [limit, setLimit] = useState(200);
  const activity = useActivity(limit);
  const { areas, areaById, personName } = useLookups();
  const [area, setArea] = useState("");

  const rows = (activity.data ?? []).filter((a) => !area || a.area_id === area);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Activity</h1>
          <p>An automatic audit trail: who added, filed, requested or shared what, and when.</p>
        </div>
      </div>
      <div className="toolbar">
        <select className="select" value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">All areas</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
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
                  <th>Area</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td className="nowrap">{formatDateTime(a.created_at)}</td>
                    <td className="nowrap">{personName(a.actor_id)}</td>
                    <td>{a.summary}</td>
                    <td>{a.area_id ? <AreaTag area={areaById.get(a.area_id)} /> : "—"}</td>
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
