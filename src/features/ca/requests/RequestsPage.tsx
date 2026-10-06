import { RequestsBoard } from "../../requests/RequestsBoard";

export function RequestsPage() {
  return (
    <RequestsBoard
      module="ca"
      title="Document requests"
      description="What your CA has asked for, and whether it has been sent."
    />
  );
}
