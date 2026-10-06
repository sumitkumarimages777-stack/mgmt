import { useState } from "react";
import { useRequests } from "../../../api";
import { Empty, Icon, Loading, Tabs } from "../../../components/ui";
import { useAuth } from "../../auth/AuthContext";
import { RequestForm } from "./RequestForm";
import { RequestModal } from "./RequestModal";
import { RequestsTable } from "./RequestsTable";
import { useRequestGroups, type RequestTab } from "./useRequestGroups";

export function RequestsPage() {
  const { can } = useAuth();
  const requests = useRequests();
  const [tab, setTab] = useState<RequestTab>("pending");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const groups = useRequestGroups(requests.data, q);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Document requests</h1>
          <p>What your CA, lawyer or team has asked for, and whether it has been sent.</p>
        </div>
        {can("ca.requests", "edit") && (
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            <Icon name="plus" size={16} /> Request a document
          </button>
        )}
      </div>

      <div className="toolbar">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "pending", label: "To send", count: groups.pending.length },
            { value: "review", label: "Sent — to review", count: groups.review.length },
            { value: "closed", label: "Closed", count: groups.closed.length },
            { value: "all", label: "All", count: groups.all.length },
          ]}
        />
        <input className="input search" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="card">
        {requests.isLoading ? (
          <Loading />
        ) : groups[tab].length === 0 ? (
          <Empty title={tab === "pending" ? "Nothing waiting to be sent" : "No requests here"} />
        ) : (
          <RequestsTable rows={groups[tab]} onOpen={setOpen} />
        )}
      </div>

      {open && <RequestModal requestId={open} onClose={() => setOpen(null)} />}
      {creating && <RequestForm onClose={() => setCreating(false)} />}
    </div>
  );
}
