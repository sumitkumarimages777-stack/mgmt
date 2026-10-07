// CA TDS types (re-exported from types.ts).
import type { EmploymentType } from "./hrTypes";

export type TdsBasis = "annual" | "monthly";
export type TdsPaymentStatus = "pending" | "paid";

export interface TdsRule {
  id: string;
  name: string;
  section: string;
  basis: TdsBasis;
  threshold: number;
  rate_percent: number | null;
  /** null = every employment type */
  employment_types: EmploymentType[] | null;
  is_active: boolean;
  notes: string | null;
}

export interface TdsPayment {
  id: string;
  /** First day of the month the TDS was deducted. */
  month: string;
  employee_id: string | null;
  employee_name: string;
  pan: string | null;
  section: string;
  salary_amount: number | null;
  tds_amount: number;
  status: TdsPaymentStatus;
  paid_on: string | null;
  challan_number: string | null;
  notes: string | null;
}

/** A team member working that month, with the salary in force then. */
export interface SalarySnapshot {
  employee_id: string;
  full_name: string;
  employee_code: string | null;
  employment_type: EmploymentType;
  pan: string | null;
  annual_ctc: number;
  monthly_gross: number;
}
