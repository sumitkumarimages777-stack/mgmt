// HR module types (re-exported from types.ts).
export type EmploymentType = "full_time" | "part_time" | "intern" | "contractor" | "consultant";
export type EmployeeStatus = "active" | "on_notice" | "exited";

export interface Employee {
  id: string;
  profile_id: string | null;
  employee_code: string | null;
  full_name: string;
  work_email: string | null;
  personal_email: string | null;
  phone: string | null;
  designation: string | null;
  department: string | null;
  employment_type: EmploymentType;
  status: EmployeeStatus;
  date_of_joining: string | null;
  date_of_exit: string | null;
  manager_id: string | null;
  date_of_birth: string | null;
  address: string | null;
  emergency_contact: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollDetails {
  employee_id: string;
  pan: string | null;
  uan: string | null;
  bank_name: string | null;
  bank_account: string | null;
  ifsc: string | null;
}

export interface SalaryRevision {
  id: string;
  employee_id: string;
  effective_from: string;
  annual_ctc: number;
  monthly_gross: number | null;
  notes: string | null;
  created_at: string;
}

export type AssetStatus = "available" | "assigned" | "repair" | "retired";

export interface Asset {
  id: string;
  name: string;
  category: string;
  serial_number: string | null;
  purchase_date: string | null;
  cost: number | null;
  status: AssetStatus;
  notes: string | null;
}

export interface AssetAssignment {
  id: string;
  asset_id: string;
  employee_id: string;
  assigned_on: string;
  returned_on: string | null;
  condition_out: string | null;
  condition_in: string | null;
  notes: string | null;
}

export type VestingFrequency = "monthly" | "quarterly" | "yearly";

export interface EsopGrant {
  id: string;
  employee_id: string;
  grant_date: string;
  options: number;
  exercise_price: number;
  vesting_start: string;
  vesting_months: number;
  cliff_months: number;
  vesting_frequency: VestingFrequency;
  status: "active" | "cancelled";
  notes: string | null;
}
