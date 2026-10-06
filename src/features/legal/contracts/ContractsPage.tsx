import { useMemo, useState } from "react";
import { useContracts } from "../../../api";
import { Empty, Icon, Loading, Tabs } from "../../../components/ui";
import { todayISO } from "../../../lib/dates";
import type { Contract } from "../../../lib/types";
import { useAuth } from "../../auth/AuthContext";
import { contractAlert } from "./contractAlerts";
import { ContractForm } from "./ContractForm";
import { ContractModal } from "./ContractModal";
import { ContractsTable } from "./ContractsTable";

type Tab = "attention" | "active" | "drafts" | "all";

export function ContractsPage() {
  const { can } = useAuth();
  const contracts = useContracts();
  const [tab, setTab] = useState<Tab>("active");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const today = todayISO();
  const opened = contracts.data?.find((c) => c.id === openId);

  const groups = useMemo(() => {
    const text = q.toLowerCase();
    const all = (contracts.data ?? []).filter((c) => !text || `${c.title} ${c.counterparty ?? ""} ${c.contract_type}`.toLowerCase().includes(text));
    return {
      attention: all.filter((c) => contractAlert(c, today)),
      active: all.filter((c) => c.status === "signed"),
      drafts: all.filter((c) => c.status === "draft" || c.status === "in_review"),
      all,
    } satisfies Record<Tab, Contract[]>;
  }, [contracts.data, q, today]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Contracts & agreements</h1>
          <p>Every agreement in one register, with end dates and renewal reminders.</p>
        </div>
        {can("legal.contracts", "edit") && (
          <button className="btn btn-primary" onClick={() => setAdding(true)}><Icon name="plus" size={16} /> Add contract</button>
        )}
      </div>
      <div className="toolbar">
        <Tabs value={tab} onChange={setTab} items={[
          { value: "active", label: "Signed", count: groups.active.length },
          { value: "attention", label: "Needs attention", count: groups.attention.length },
          { value: "drafts", label: "Drafts & in review", count: groups.drafts.length },
          { value: "all", label: "All", count: groups.all.length },
        ]} />
        <input className="input search" placeholder="Search title, counterparty…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="card">
        {contracts.isLoading ? <Loading /> : groups[tab].length === 0 ? <Empty title="No contracts here" /> : <ContractsTable rows={groups[tab]} onOpen={(c) => setOpenId(c.id)} />}
      </div>
      {opened && <ContractModal contract={opened} onClose={() => setOpenId(null)} />}
      {adding && <ContractForm onClose={() => setAdding(false)} />}
    </div>
  );
}
