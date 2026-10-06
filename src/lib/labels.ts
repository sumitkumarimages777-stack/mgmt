import type { AccessLevel, FilingStatus, ModuleKey, RequestStatus } from "./types";

export const MODULE_LABEL: Record<ModuleKey, string> = {
  ca: "CA & Compliance",
  hr: "HR",
  legal: "Legal",
};

export const ACCESS_LABEL: Record<AccessLevel, string> = {
  own: "Own only",
  view: "View",
  edit: "Edit",
  manage: "Manage",
};

export const ACCESS_HELP: Record<AccessLevel | "none", string> = {
  none: "Can't see it",
  own: "Only records about themselves",
  view: "See everything, change nothing",
  edit: "See, add and update",
  manage: "Everything, including delete",
};

export const FILING_CATEGORIES = ["GST", "Income tax & TDS", "ROC / MCA", "Payroll", "Other"];

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
