import { Navigate, Route, Routes } from "react-router-dom";
import { Loading } from "../components/ui";
import { useAuth } from "../features/auth/AuthContext";
import { LoginPage } from "../features/auth/LoginPage";
import { Layout } from "./Layout";
import {
  AccountPage, ActivityPage, AreasPage, DashboardPage, DocumentsPage, FilingsPage, RequestsPage, UsersPage,
} from "./pages";

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

export function App() {
  const { session, loading, profile, isAdmin } = useAuth();

  if (loading) return <Loading />;
  if (!session) return <LoginPage />;
  if (profile && !profile.is_active) return <Deactivated />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="filings" element={<FilingsPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="account" element={<AccountPage />} />
        {isAdmin && <Route path="admin/users" element={<UsersPage />} />}
        {isAdmin && <Route path="admin/areas" element={<AreasPage />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
