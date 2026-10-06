export type ModuleKey = "ca" | "hr" | "legal";
export type AccessLevel = "own" | "view" | "edit" | "manage";
export type FilingStatus = "pending" | "in_progress" | "filed" | "not_applicable";
export type RequestStatus = "open" | "submitted" | "accepted" | "rejected" | "cancelled";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  organization: string | null;
  is_active: boolean;
  created_at: string;
}

/** One grantable feature, e.g. "ca.filings". */
export interface PermissionDef {
  key: string;
  module: ModuleKey;
  label: string;
  description: string | null;
  supports_own: boolean;
  sort: number;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  is_superuser: boolean;
  created_at: string;
}

export interface RolePermission {
  role_id: string;
  permission_key: string;
  level: AccessLevel;
}

export interface UserRole {
  user_id: string;
  role_id: string;
}

export interface Filing {
  id: string;
  category: string;
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
  module: ModuleKey;
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
  module: ModuleKey;
  feature: string;
  perm_key: string;
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
  employee_id: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  perm_key: string;
  request_id: string | null;
  filing_id: string | null;
  body: string;
  author_id: string | null;
  created_at: string;
}

export interface Activity {
  id: number;
  perm_key: string | null;
  actor_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  summary: string;
  created_at: string;
}

export * from "./hrTypes";
