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
export const TeamPage = lazy(() => import("../features/hr/team/TeamPage").then((m) => ({ default: m.TeamPage })));
export const EmployeePage = lazy(() => import("../features/hr/employee/EmployeePage").then((m) => ({ default: m.EmployeePage })));
export const HrDocumentsPage = lazy(() => import("../features/hr/documents/HrDocumentsPage").then((m) => ({ default: m.HrDocumentsPage })));
export const EquipmentPage = lazy(() => import("../features/hr/equipment/EquipmentPage").then((m) => ({ default: m.EquipmentPage })));
export const EsopPage = lazy(() => import("../features/hr/esop/EsopPage").then((m) => ({ default: m.EsopPage })));
export const AllRequestsPage = lazy(() => import("../features/requests/AllRequestsPage").then((m) => ({ default: m.AllRequestsPage })));
export const HrRequestsPage = lazy(() => import("../features/hr/requests/HrRequestsPage").then((m) => ({ default: m.HrRequestsPage })));
export const LegalRequestsPage = lazy(() => import("../features/legal/requests/LegalRequestsPage").then((m) => ({ default: m.LegalRequestsPage })));
export const ContractsPage = lazy(() => import("../features/legal/contracts/ContractsPage").then((m) => ({ default: m.ContractsPage })));
export const MattersPage = lazy(() => import("../features/legal/matters/MattersPage").then((m) => ({ default: m.MattersPage })));
export const MeetingsPage = lazy(() => import("../features/company/meetings/MeetingsPage").then((m) => ({ default: m.MeetingsPage })));
export const MeetingPage = lazy(() => import("../features/company/meetings/detail/MeetingPage").then((m) => ({ default: m.MeetingPage })));
export const TdsPage = lazy(() => import("../features/ca/tds/TdsPage").then((m) => ({ default: m.TdsPage })));
export const TdsRulesPage = lazy(() => import("../features/ca/tdsRules/TdsRulesPage").then((m) => ({ default: m.TdsRulesPage })));
export const SalariesPage = lazy(() => import("../features/hr/salaries/SalariesPage").then((m) => ({ default: m.SalariesPage })));
