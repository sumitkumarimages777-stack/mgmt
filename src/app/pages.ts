// Each page is loaded on first visit, so the initial download stays small.
import { lazy } from "react";

export const DashboardPage = lazy(() => import("../features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })));
export const FilingsPage = lazy(() => import("../features/filings/FilingsPage").then((m) => ({ default: m.FilingsPage })));
export const RequestsPage = lazy(() => import("../features/requests/RequestsPage").then((m) => ({ default: m.RequestsPage })));
export const DocumentsPage = lazy(() => import("../features/documents/DocumentsPage").then((m) => ({ default: m.DocumentsPage })));
export const ActivityPage = lazy(() => import("../features/activity/ActivityPage").then((m) => ({ default: m.ActivityPage })));
export const AccountPage = lazy(() => import("../features/account/AccountPage").then((m) => ({ default: m.AccountPage })));
export const UsersPage = lazy(() => import("../features/admin/users/UsersPage").then((m) => ({ default: m.UsersPage })));
export const AreasPage = lazy(() => import("../features/admin/areas/AreasPage").then((m) => ({ default: m.AreasPage })));
