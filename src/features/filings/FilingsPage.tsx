import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useFilings, useLookups } from "../../api";
import { Empty, Icon, Loading, Tabs } from "../../components/ui";
import { useAuth } from "../auth/AuthContext";
import { FilingModal } from "./FilingModal";
import { FilingsTable } from "./FilingsTable";
import { GenerateCalendarModal } from "./generate/GenerateCalendarModal";
import { useFilingGroups, type FilingTab } from "./useFilingGroups";

export function FilingsPage() {
  const { canEditAny, isAdmin } = useAuth();
  const filings = useFilings();
  const { areas } = useLookups();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as FilingTab) || "upcoming";
  const [area, setArea] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const groups = useFilingGroups(filings.data, area, q);
  const rows = groups[tab];
  const noneAtAll = (filings.data ?? []).length === 0;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Filings</h1>
          <p>Statutory filings and compliance deadlines — what's coming up, what's late and what's done.</p>
        </div>
        <div className="actions">
          {isAdmin && (
            <button className="btn" onClick={() => setGenerating(true)}>
              <Icon name="calendar" size={16} /> Generate compliance calendar
            </button>
          )}
          {canEditAny && (
            <button className="btn btn-primary" onClick={() => setCreating(true)}>
              <Icon name="plus" size={16} /> Add filing
            </button>
          )}
        </div>
      </div>

      <div className="toolbar">
        <Tabs
          value={tab}
          onChange={(v) => setParams({ tab: v })}
          items={[
            { value: "upcoming", label: "Upcoming", count: groups.upcoming.length },
            { value: "overdue", label: "Overdue", count: groups.overdue.length },
            { value: "filed", label: "Done", count: groups.filed.length },
            { value: "all", label: "All", count: groups.all.length },
          ]}
        />
        <select className="select" value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">All areas</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <input className="input search" placeholder="Search form, period…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="card">
        {filings.isLoading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <Empty title={tab === "overdue" ? "Nothing overdue 🎉" : "No filings here"}>
            {noneAtAll && isAdmin && "Use “Generate compliance calendar” to add a full year of GST, TDS, ROC and payroll deadlines."}
          </Empty>
        ) : (
          <FilingsTable rows={rows} showFiled={tab === "filed"} onOpen={setOpen} />
        )}
      </div>

      {open && <FilingModal filingId={open} onClose={() => setOpen(null)} />}
      {creating && <FilingModal filingId={null} onClose={() => setCreating(false)} />}
      {generating && <GenerateCalendarModal onClose={() => setGenerating(false)} />}
    </div>
  );
}
