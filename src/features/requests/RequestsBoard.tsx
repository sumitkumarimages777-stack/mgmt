import { useState } from "react";
import { useRequests } from "../../api";
import { Empty, Icon, Loading, Tabs } from "../../components/ui";
import type { ModuleKey } from "../../lib/types";
import { useAuth } from "../auth/AuthContext";
import { RequestForm } from "./RequestForm";
import { RequestModal } from "./RequestModal";
import { RequestsTable } from "./RequestsTable";
import { useRequestGroups, type RequestTab } from "./useRequestGroups";

interface Props {
  /** Show one department's requests (its inbox). Omit for every request the user can see. */
  module?: ModuleKey;
  title: string;
  description: string;
}

/** Request list used by every department and by the general Requests page. */
export function RequestsBoard({ module, title, description }: Props) {
  const { can, permissions, profile } = useAuth();
  const requests = useRequests();
  const [tab, setTab] = useState<RequestTab>("pending");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const scoped = (requests.data ?? []).filter((r) => !module || r.module === module || r.from_module === module);
  const groups = useRequestGroups(scoped, q, profile?.id);
  const canRaise = module ? can(`${module}.requests`, "own") : [...permissions.keys()].some((k) => k.endsWith(".requests"));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {canRaise && (
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            <Icon name="plus" size={16} /> New request
          </button>
        )}
      </div>

      <div className="toolbar">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "pending", label: "Open", count: groups.pending.length },
            { value: "review", label: "Delivered — to review", count: groups.review.length },
            { value: "mine", label: "Raised by me", count: groups.mine.length },
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
          <Empty title="No requests here" />
        ) : (
          <RequestsTable rows={groups[tab]} showRoute={!module || module !== "ca"} onOpen={setOpen} />
        )}
      </div>

      {open && <RequestModal requestId={open} onClose={() => setOpen(null)} />}
      {creating && <RequestForm module={module} onClose={() => setCreating(false)} />}
    </div>
  );
}
