import { CONTRACT_STATUS_LABEL } from "../labels";
import type { Contract } from "../../../lib/types";
import { contractAlert } from "./contractAlerts";

const ALERT = {
  expired: ["badge-red", "Expired"],
  renewal_due: ["badge-amber", "Renewal notice due"],
  expiring_soon: ["badge-amber", "Ending soon"],
} as const;

const STATUS_BADGE = { draft: "badge-gray", in_review: "badge-blue", signed: "badge-green", expired: "badge-gray", terminated: "badge-gray" } as const;

export function ContractAlertBadge({ contract, today }: { contract: Contract; today: string }) {
  const alert = contractAlert(contract, today);
  if (alert) {
    const [cls, text] = ALERT[alert];
    return <span className={`badge ${cls}`}>{text}</span>;
  }
  return <span className={`badge ${STATUS_BADGE[contract.status]}`}>{CONTRACT_STATUS_LABEL[contract.status]}</span>;
}
