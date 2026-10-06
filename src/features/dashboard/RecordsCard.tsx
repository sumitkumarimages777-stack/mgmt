import { useDocuments, useLookups } from "../../api";
import { Empty } from "../../components/ui";
import { formatDate } from "../../lib/dates";
import { DashboardCard } from "./DashboardCard";

/** Latest documents shared in the CA module. */
export function RecordsCard() {
  const documents = useDocuments();
  const { personName } = useLookups();
  const items = (documents.data ?? []).filter((d) => d.module === "ca").slice(0, 6);
  return (
    <DashboardCard title="Recently shared" link={{ to: "/ca/records", label: "All records" }}>
      {items.length === 0 ? (
        <Empty title="Nothing shared yet" />
      ) : (
        <ul className="list">
          {items.map((d) => (
            <li key={d.id} className="list-item">
              <div className="grow">
                <div className="cell-title">{d.title}</div>
                <div className="cell-sub">{personName(d.uploaded_by)} · {formatDate(d.created_at)}</div>
              </div>
              {d.category && <span className="faint small nowrap">{d.category}</span>}
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
