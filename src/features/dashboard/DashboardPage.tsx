import { useState } from "react";
import { Empty, Loading } from "../../components/ui";
import { formatDate, fyLabel } from "../../lib/dates";
import { useAuth } from "../auth/AuthContext";
import { FilingModal } from "../ca/filings/FilingModal";
import { RequestModal } from "../requests/RequestModal";
import { ActivityCard } from "./ActivityCard";
import { AttentionCard } from "./AttentionCard";
import { HrCard } from "./HrCard";
import { LegalCard } from "./LegalCard";
import { RecordsCard } from "./RecordsCard";
import { RequestsCard } from "./RequestsCard";
import { StatCards } from "./StatCards";
import { useDashboardStats } from "./useDashboardStats";

export function DashboardPage() {
  const { profile, isAdmin, permissions, can } = useAuth();
  const stats = useDashboardStats();
  const [openFiling, setOpenFiling] = useState<string | null>(null);
  const [openRequest, setOpenRequest] = useState<string | null>(null);

  if (stats.loading) return <div className="page"><Loading /></div>;
  if (!isAdmin && permissions.size === 0) {
    return (
      <div className="page">
        <div className="card">
          <Empty title="Your access hasn't been set up yet">
            Ask the admin to give you a role (for example CA, HR Manager, Lawyer or Employee).
          </Empty>
        </div>
      </div>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0];
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Hello{firstName ? `, ${firstName}` : ""}</h1>
          <p>{formatDate(stats.today)} · {fyLabel(stats.fy)}</p>
        </div>
      </div>
      {(can("ca.filings") || can("ca.requests")) && <StatCards stats={stats} />}
      <div className="grid grid-2">
        {can("ca.filings") && <AttentionCard stats={stats} canEdit={can("ca.filings", "edit")} onOpen={setOpenFiling} />}
        {can("ca.requests") && <RequestsCard stats={stats} onOpen={setOpenRequest} />}
        {can("ca.documents") && <RecordsCard />}
        {can("hr.team", "own") && <HrCard />}
        {(can("legal.contracts") || can("legal.matters")) && <LegalCard />}
        <ActivityCard />
      </div>
      {openFiling && <FilingModal filingId={openFiling} onClose={() => setOpenFiling(null)} />}
      {openRequest && <RequestModal requestId={openRequest} onClose={() => setOpenRequest(null)} />}
    </div>
  );
}
