import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";
import { Layout } from "./components/Layout";
import { Loading } from "./components/ui";
import { AccountPage } from "./pages/Account";
import { ActivityPage } from "./pages/Activity";
import { AreasPage } from "./pages/admin/Areas";
import { UsersPage } from "./pages/admin/Users";
import { Dashboard } from "./pages/Dashboard";
import { DocumentsPage } from "./pages/DocumentsPage";
import { FilingsPage } from "./pages/Filings";
import { Login } from "./pages/Login";
import { RequestsPage } from "./pages/Requests";

export function App() {
  const { session, loading, profile, isAdmin } = useAuth();

  if (loading) return <Loading />;
  if (!session) return <Login />;
  if (profile && !profile.is_active) {
    return (
      <div className="auth-wrap">
        <div className="card auth-card">
          <h1>Account deactivated</h1>
          <p className="muted">Please contact the admin.</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
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
