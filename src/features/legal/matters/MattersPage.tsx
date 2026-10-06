import { useMemo, useState } from "react";
import { useMatters } from "../../../api";
import { Empty, Icon, Loading, Tabs } from "../../../components/ui";
import { useAuth } from "../../auth/AuthContext";
import { MatterForm } from "./MatterForm";
import { MatterModal } from "./MatterModal";
import { MattersTable } from "./MattersTable";

type Tab = "open" | "closed" | "all";

export function MattersPage() {
  const { can } = useAuth();
  const matters = useMatters();
  const [tab, setTab] = useState<Tab>("open");
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const all = useMemo(() => matters.data ?? [], [matters.data]);
  const rows = tab === "all" ? all : all.filter((m) => m.status === tab);
  const opened = all.find((m) => m.id === openId);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Notices & matters</h1>
          <p>Legal notices received or sent, disputes, trademark and regulatory matters — with the next date to act on.</p>
        </div>
        {can("legal.matters", "edit") && (
          <button className="btn btn-primary" onClick={() => setAdding(true)}><Icon name="plus" size={16} /> Add matter</button>
        )}
      </div>
      <div className="toolbar">
        <Tabs value={tab} onChange={setTab} items={[
          { value: "open", label: "Open", count: all.filter((m) => m.status === "open").length },
          { value: "closed", label: "Closed", count: all.filter((m) => m.status === "closed").length },
          { value: "all", label: "All", count: all.length },
        ]} />
      </div>
      <div className="card">
        {matters.isLoading ? <Loading /> : rows.length === 0 ? <Empty title="Nothing here" /> : <MattersTable rows={rows} onOpen={setOpenId} />}
      </div>
      {opened && <MatterModal matter={opened} onClose={() => setOpenId(null)} />}
      {adding && <MatterForm onClose={() => setAdding(false)} />}
    </div>
  );
}
