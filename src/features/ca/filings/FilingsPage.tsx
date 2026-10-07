import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useFilings } from "../../../api";
import { Empty, Icon, Loading, Tabs } from "../../../components/ui";
import { FILING_CATEGORIES } from "../../../lib/labels";
import { useAuth } from "../../auth/AuthContext";
import { BulkDeleteBar } from "./BulkDeleteBar";
import { FilingModal } from "./FilingModal";
import { FilingsTable } from "./FilingsTable";
import { GenerateCalendarModal } from "./generate/GenerateCalendarModal";
import { useFilingGroups, type FilingTab } from "./useFilingGroups";
import { useRowSelection } from "./useRowSelection";

export function FilingsPage() {
  const { can } = useAuth();
  const filings = useFilings();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as FilingTab) || "upcoming";
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const groups = useFilingGroups(filings.data, category, q);
  const rows = groups[tab];
  const selection = useRowSelection(useMemo(() => rows.map((f) => f.id), [rows]));
  const canDelete = can("ca.filings", "manage");
  const noneAtAll = (filings.data ?? []).length === 0;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Filings</h1>
          <p>Statutory filings and compliance deadlines — what's coming up, what's late and what's done.</p>
        </div>
        <div className="actions">
          {can("ca.filings", "edit") && (
            <button className="btn" onClick={() => setGenerating(true)}>
              <Icon name="calendar" size={16} /> Generate compliance calendar
            </button>
          )}
          {can("ca.filings", "edit") && (
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
        <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {FILING_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input className="input search" placeholder="Search form, period…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="card">
        {filings.isLoading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <Empty title={tab === "overdue" ? "Nothing overdue 🎉" : "No filings here"}>
            {noneAtAll && can("ca.filings", "edit") && "Use “Generate compliance calendar” to add a full year of GST, TDS, ROC and payroll deadlines."}
          </Empty>
        ) : (
          <>
            {canDelete && <BulkDeleteBar selection={selection} />}
            <FilingsTable rows={rows} showFiled={tab === "filed"} onOpen={setOpen} selection={canDelete ? selection : undefined} />
          </>
        )}
      </div>

      {open && <FilingModal filingId={open} onClose={() => setOpen(null)} />}
      {creating && <FilingModal filingId={null} onClose={() => setCreating(false)} />}
      {generating && <GenerateCalendarModal onClose={() => setGenerating(false)} />}
    </div>
  );
}
