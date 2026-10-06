import { RequestsBoard } from "../../requests/RequestsBoard";

export function HrRequestsPage() {
  return (
    <RequestsBoard
      module="hr"
      title="HR requests"
      description="Letters, certificates, onboarding and anything else asked of HR — plus what HR has asked other departments."
    />
  );
}
