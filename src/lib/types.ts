export type UserRole = "admin" | "staff" | "external";
export type AreaPermission = "view" | "edit";
export type FilingStatus = "pending" | "in_progress" | "filed" | "not_applicable";
export type RequestStatus = "open" | "submitted" | "accepted" | "rejected" | "cancelled";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  organization: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Area {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
}

export interface AreaMember {
  area_id: string;
  user_id: string;
  permission: AreaPermission;
}

export interface Filing {
  id: string;
  area_id: string;
  title: string;
  form_code: string | null;
  period: string;
  due_date: string; // yyyy-mm-dd
  status: FilingStatus;
  filed_on: string | null;
  ack_number: string | null;
  notes: string | null;
  assignee_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentRequest {
  id: string;
  area_id: string;
  title: string;
  description: string | null;
  filing_id: string | null;
  status: RequestStatus;
  due_date: string | null;
  requested_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SharedDocument {
  id: string;
  area_id: string;
  title: string;
  description: string | null;
  category: string | null;
  storage_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  external_url: string | null;
  request_id: string | null;
  filing_id: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  area_id: string;
  request_id: string | null;
  filing_id: string | null;
  body: string;
  author_id: string | null;
  created_at: string;
}

export interface Activity {
  id: number;
  area_id: string | null;
  actor_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  summary: string;
  created_at: string;
}

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
