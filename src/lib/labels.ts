import type { FilingStatus, RequestStatus, UserRole } from "./types";

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  staff: "Team member",
  external: "External advisor",
};

export const FILING_STATUS_LABEL: Record<FilingStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  filed: "Filed",
  not_applicable: "Not applicable",
};

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  open: "Waiting for us",
  submitted: "Submitted — to review",
  accepted: "Accepted",
  rejected: "Re-upload needed",
  cancelled: "Cancelled",
};

export const DOCUMENT_CATEGORIES = [
  "Bank statement",
  "Invoice / Bill",
  "Ledger / Books",
  "Payroll",
  "Tax challan",
  "Acknowledgement",
  "Agreement / Contract",
  "Notice / Order",
  "Company records",
  "KYC",
  "Other",
];
