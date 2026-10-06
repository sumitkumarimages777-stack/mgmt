import { Navigate, Route, Routes } from "react-router-dom";
import { Loading } from "../components/ui";
import { useAuth } from "../features/auth/AuthContext";
import { LoginPage } from "../features/auth/LoginPage";
import { Layout } from "./Layout";
import {
  AccountPage, ActivityPage, AllRequestsPage, ContractsPage, DashboardPage, EmployeePage, EquipmentPage, EsopPage,
  FilingsPage, HrDocumentsPage, HrRequestsPage, LegalRequestsPage, MattersPage, PeoplePage, RecordsPage, RequestsPage,
  RolesPage, TeamPage,
} from "./pages";
import { RequirePerm } from "./RequirePerm";

function Deactivated() {
  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h1>Account deactivated</h1>
        <p className="muted">Please contact the admin.</p>
      </div>
    </div>
  );
}

/** Links from before the department menu existed. */
const LEGACY = [
  ["filings", "/ca/filings"],
  ["documents", "/ca/records"],
  ["admin/users", "/admin/people"],
  ["admin/areas", "/admin/roles"],
] as const;

export function App() {
  const { session, loading, profile } = useAuth();

  if (loading) return <Loading />;
  if (!session) return <LoginPage />;
  if (profile && !profile.is_active) return <Deactivated />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="ca/filings" element={<RequirePerm perm="ca.filings"><FilingsPage /></RequirePerm>} />
        <Route path="ca/requests" element={<RequirePerm perm="ca.requests"><RequestsPage /></RequirePerm>} />
        <Route path="ca/records" element={<RequirePerm perm="ca.documents"><RecordsPage /></RequirePerm>} />
        <Route path="hr/team" element={<RequirePerm perm="hr.team" min="own"><TeamPage /></RequirePerm>} />
        <Route path="hr/team/:id" element={<RequirePerm perm="hr.team" min="own"><EmployeePage /></RequirePerm>} />
        <Route path="hr/documents" element={<RequirePerm perm="hr.documents"><HrDocumentsPage /></RequirePerm>} />
        <Route path="hr/equipment" element={<RequirePerm perm="hr.equipment"><EquipmentPage /></RequirePerm>} />
        <Route path="hr/esop" element={<RequirePerm perm="hr.esop"><EsopPage /></RequirePerm>} />
        <Route path="hr/requests" element={<RequirePerm perm="hr.requests"><HrRequestsPage /></RequirePerm>} />
        <Route path="legal/requests" element={<RequirePerm perm="legal.requests"><LegalRequestsPage /></RequirePerm>} />
        <Route path="legal/contracts" element={<RequirePerm perm="legal.contracts"><ContractsPage /></RequirePerm>} />
        <Route path="legal/matters" element={<RequirePerm perm="legal.matters"><MattersPage /></RequirePerm>} />
        <Route path="requests" element={<AllRequestsPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="admin/people" element={<RequirePerm perm="admin"><PeoplePage /></RequirePerm>} />
        <Route path="admin/roles" element={<RequirePerm perm="admin"><RolesPage /></RequirePerm>} />
        {LEGACY.map(([from, to]) => <Route key={from} path={from} element={<Navigate to={to} replace />} />)}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
