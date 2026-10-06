// Standard Indian statutory compliance calendar for a private limited company.
//
// These are the *regular* due dates. The government often extends them —
// edit the generated filing's due date when an extension is notified.

export type ComplianceGroup = "tax" | "roc" | "payroll";

export interface CompliancePreset {
  key: string;
  group: ComplianceGroup;
  /** Filing category it is saved under (see FILING_CATEGORIES). */
  category: string;
  title: string;
  formCode: string;
  frequency: "Monthly" | "Quarterly" | "Half-yearly" | "Yearly";
  note: string;
}

export interface GeneratedFiling {
  presetKey: string;
  group: ComplianceGroup;
  category: string;
  title: string;
  form_code: string;
  period: string;
  due_date: string;
}

export const COMPLIANCE_GROUP_LABEL: Record<ComplianceGroup, string> = {
  tax: "GST / TDS / Income Tax",
  roc: "ROC / MCA",
  payroll: "Payroll (PF / ESI)",
};

const GST = "GST";
const INCOME_TAX = "Income tax & TDS";

export const COMPLIANCE_PRESETS: CompliancePreset[] = [
  { key: "gstr1", group: "tax", category: GST, title: "GSTR-1", formCode: "GSTR-1", frequency: "Monthly", note: "11th of next month" },
  { key: "gstr3b", group: "tax", category: GST, title: "GSTR-3B", formCode: "GSTR-3B", frequency: "Monthly", note: "20th of next month" },
  { key: "tds_payment", group: "tax", category: INCOME_TAX, title: "TDS / TCS payment", formCode: "Challan 281", frequency: "Monthly", note: "7th of next month (March: 30 April)" },
  { key: "tds_return", group: "tax", category: INCOME_TAX, title: "TDS return", formCode: "24Q / 26Q", frequency: "Quarterly", note: "31 Jul, 31 Oct, 31 Jan, 31 May" },
  { key: "advance_tax", group: "tax", category: INCOME_TAX, title: "Advance tax", formCode: "Challan 280", frequency: "Quarterly", note: "15 Jun, 15 Sep, 15 Dec, 15 Mar" },
  { key: "tax_audit", group: "tax", category: INCOME_TAX, title: "Tax audit report", formCode: "3CA / 3CD", frequency: "Yearly", note: "30 September after year end" },
  { key: "itr", group: "tax", category: INCOME_TAX, title: "Income tax return", formCode: "ITR-6", frequency: "Yearly", note: "31 October after year end (audited company)" },
  { key: "gstr9", group: "tax", category: GST, title: "GST annual return", formCode: "GSTR-9 / 9C", frequency: "Yearly", note: "31 December after year end" },
  { key: "dpt3", group: "roc", category: "ROC / MCA", title: "Return of deposits", formCode: "DPT-3", frequency: "Yearly", note: "30 June after year end" },
  { key: "dir3kyc", group: "roc", category: "ROC / MCA", title: "Director KYC", formCode: "DIR-3 KYC", frequency: "Yearly", note: "30 September" },
  { key: "aoc4", group: "roc", category: "ROC / MCA", title: "Financial statements", formCode: "AOC-4", frequency: "Yearly", note: "30 days from AGM (AGM by 30 Sep → 30 Oct)" },
  { key: "mgt7", group: "roc", category: "ROC / MCA", title: "Annual return", formCode: "MGT-7 / 7A", frequency: "Yearly", note: "60 days from AGM (→ 29 Nov)" },
  { key: "msme1", group: "roc", category: "ROC / MCA", title: "MSME dues return", formCode: "MSME-1", frequency: "Half-yearly", note: "31 Oct and 30 Apr" },
  { key: "pf", group: "payroll", category: "Payroll", title: "PF return & payment", formCode: "ECR", frequency: "Monthly", note: "15th of next month" },
  { key: "esi", group: "payroll", category: "Payroll", title: "ESI payment", formCode: "ESIC", frequency: "Monthly", note: "15th of next month" },
];
