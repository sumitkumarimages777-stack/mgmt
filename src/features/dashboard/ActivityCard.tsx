import { useActivity, useLookups } from "../../api";
import { AreaTag, Empty } from "../../components/ui";
import { formatDateTime } from "../../lib/dates";
import { DashboardCard } from "./DashboardCard";

export function ActivityCard() {
  const activity = useActivity(8);
  const { areaById, personName } = useLookups();
  const items = activity.data ?? [];
  return (
    <DashboardCard title="Recent activity" link={{ to: "/activity", label: "Full log" }}>
      {items.length === 0 ? (
        <Empty title="No activity yet" />
      ) : (
        <ul className="list">
          {items.map((a) => (
            <li key={a.id} className="list-item">
              <div className="grow">
                <div>{a.summary}</div>
                <div className="cell-sub">{personName(a.actor_id)} · {formatDateTime(a.created_at)}</div>
              </div>
              {a.area_id && <AreaTag area={areaById.get(a.area_id)} />}
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
