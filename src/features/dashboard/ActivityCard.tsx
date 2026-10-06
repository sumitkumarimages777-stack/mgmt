import { useActivity, useLookups } from "../../api";
import { Empty, Tag } from "../../components/ui";
import { formatDateTime } from "../../lib/dates";
import { usePermLabel } from "../activity/usePermLabel";
import { SectionCard } from "../../components/ui";

export function ActivityCard() {
  const activity = useActivity(8);
  const { personName } = useLookups();
  const permLabel = usePermLabel();
  const items = activity.data ?? [];
  return (
    <SectionCard title="Recent activity" link={{ to: "/activity", label: "Full log" }}>
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
              <Tag>{permLabel(a.perm_key)}</Tag>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
