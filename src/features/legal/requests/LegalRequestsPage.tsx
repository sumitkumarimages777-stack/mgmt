import { RequestsBoard } from "../../requests/RequestsBoard";

export function LegalRequestsPage() {
  return (
    <RequestsBoard
      module="legal"
      title="Legal requests"
      description="Contracts to draft, agreements to review, notices to answer — asked of Legal by any department."
    />
  );
}
