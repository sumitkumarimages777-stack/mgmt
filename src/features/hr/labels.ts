import type { AssetStatus, EmployeeStatus, EmploymentType, VestingFrequency } from "../../lib/types";

export const EMPLOYMENT_TYPE_LABEL: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  intern: "Intern",
  contractor: "Contractor",
  consultant: "Consultant",
};

export const EMPLOYEE_STATUS_LABEL: Record<EmployeeStatus, string> = {
  active: "Active",
  on_notice: "On notice",
  exited: "Exited",
};

export const ASSET_STATUS_LABEL: Record<AssetStatus, string> = {
  available: "Available",
  assigned: "Assigned",
  repair: "In repair",
  retired: "Retired",
};

export const ASSET_CATEGORIES = ["Laptop", "Monitor", "Phone", "Tablet", "Headphones", "Keyboard / Mouse", "ID card", "SIM card", "Other"];

export const VESTING_FREQUENCY_LABEL: Record<VestingFrequency, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

export const HR_DOCUMENT_CATEGORIES = [
  "Offer letter",
  "Employment contract",
  "Appointment letter",
  "NDA",
  "ID proof",
  "Address proof",
  "Education certificate",
  "Relieving letter",
  "Payslip",
  "Other",
];
