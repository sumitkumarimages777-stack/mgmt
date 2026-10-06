// Each page is loaded on first visit, so the initial download stays small.
import { lazy } from "react";

export const DashboardPage = lazy(() => import("../features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })));
export const FilingsPage = lazy(() => import("../features/ca/filings/FilingsPage").then((m) => ({ default: m.FilingsPage })));
export const RequestsPage = lazy(() => import("../features/ca/requests/RequestsPage").then((m) => ({ default: m.RequestsPage })));
export const RecordsPage = lazy(() => import("../features/ca/records/RecordsPage").then((m) => ({ default: m.RecordsPage })));
export const ActivityPage = lazy(() => import("../features/activity/ActivityPage").then((m) => ({ default: m.ActivityPage })));
export const AccountPage = lazy(() => import("../features/account/AccountPage").then((m) => ({ default: m.AccountPage })));
export const PeoplePage = lazy(() => import("../features/admin/people/PeoplePage").then((m) => ({ default: m.PeoplePage })));
export const RolesPage = lazy(() => import("../features/admin/roles/RolesPage").then((m) => ({ default: m.RolesPage })));
