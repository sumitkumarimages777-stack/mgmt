import { useContracts, useMatters } from "../../api";
import { Empty } from "../../components/ui";
import { addDays, formatDate, relativeDue, todayISO } from "../../lib/dates";
import { useAuth } from "../auth/AuthContext";
import { contractAlert } from "../legal/contracts/contractAlerts";
import { SectionCard } from "../../components/ui";

const ALERT_TEXT = { expired: "expired", renewal_due: "renewal notice due", expiring_soon: "ending soon" } as const;

/** Contracts that need attention and legal dates in the next two weeks. */
export function LegalCard() {
  const { can } = useAuth();
  const contracts = useContracts(can("legal.contracts"));
  const matters = useMatters(can("legal.matters"));
  const today = todayISO();
  const in14 = addDays(today, 14);
  const alerts = (contracts.data ?? []).flatMap((c) => {
    const a = contractAlert(c, today);
    return a ? [{ id: c.id, title: c.title, note: `${ALERT_TEXT[a]} · ends ${formatDate(c.end_date)}` }] : [];
  });
  const dates = (matters.data ?? [])
    .filter((m) => m.status === "open" && m.next_date && m.next_date <= in14)
    .map((m) => ({ id: m.id, title: m.title, note: `${m.next_action || "Next date"} · ${relativeDue(m.next_date!, today)}` }));
  const items = [...dates, ...alerts].slice(0, 8);

  return (
    <SectionCard title="Legal" link={{ to: can("legal.matters") ? "/legal/matters" : "/legal/contracts", label: "Open" }}>
      {items.length === 0 ? (
        <Empty title="Nothing due in the next two weeks" />
      ) : (
        <ul className="list">
          {items.map((i) => (
            <li key={i.id} className="list-item">
              <div className="grow">
                <div className="cell-title">{i.title}</div>
                <div className="cell-sub">{i.note}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
