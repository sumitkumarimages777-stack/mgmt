import { useState } from "react";
import { useLookups, useRequests } from "../../api";
import { Empty, Icon, Loading, Tabs } from "../../components/ui";
import { useAuth } from "../auth/AuthContext";
import { RequestForm } from "./RequestForm";
import { RequestModal } from "./RequestModal";
import { RequestsTable } from "./RequestsTable";
import { useRequestGroups, type RequestTab } from "./useRequestGroups";

export function RequestsPage() {
  const { canEditAny } = useAuth();
  const requests = useRequests();
  const { areas } = useLookups();
  const [tab, setTab] = useState<RequestTab>("pending");
  const [area, setArea] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const groups = useRequestGroups(requests.data, area, q);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Document requests</h1>
          <p>What your CA, lawyer or team has asked for, and whether it has been sent.</p>
        </div>
        {canEditAny && (
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
        <select className="select" value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">All areas</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
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
