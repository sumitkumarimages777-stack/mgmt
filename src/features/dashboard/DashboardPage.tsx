import { useState } from "react";
import { useLookups } from "../../api";
import { Empty, Loading } from "../../components/ui";
import { formatDate, fyLabel } from "../../lib/dates";
import { useAuth } from "../auth/AuthContext";
import { FilingModal } from "../filings/FilingModal";
import { RequestModal } from "../requests/RequestModal";
import { ActivityCard } from "./ActivityCard";
import { AreasCard } from "./AreasCard";
import { AttentionCard } from "./AttentionCard";
import { RequestsCard } from "./RequestsCard";
import { StatCards } from "./StatCards";
import { useDashboardStats } from "./useDashboardStats";

export function DashboardPage() {
  const { profile, isAdmin, permissions } = useAuth();
  const stats = useDashboardStats();
  const { areas } = useLookups();
  const [openFiling, setOpenFiling] = useState<string | null>(null);
  const [openRequest, setOpenRequest] = useState<string | null>(null);

  if (stats.loading) return <div className="page"><Loading /></div>;
  if (!isAdmin && permissions.size === 0) {
    return (
      <div className="page">
        <div className="card">
          <Empty title="Your access hasn't been set up yet">
            Ask the admin to give you access to the areas you work on (e.g. Accounts & Tax, Legal).
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
          <p>{formatDate(stats.today)} · {fyLabel(stats.fy)} · {areas.length} area{areas.length === 1 ? "" : "s"}</p>
        </div>
      </div>
      <StatCards stats={stats} />
      <div className="grid grid-2">
        <AttentionCard stats={stats} isAdmin={isAdmin} onOpen={setOpenFiling} />
        <RequestsCard stats={stats} onOpen={setOpenRequest} />
        <ActivityCard />
        <AreasCard stats={stats} />
      </div>
      {openFiling && <FilingModal filingId={openFiling} onClose={() => setOpenFiling(null)} />}
      {openRequest && <RequestModal requestId={openRequest} onClose={() => setOpenRequest(null)} />}
    </div>
  );
}
