// Legal module types (re-exported from types.ts).
export type ContractStatus = "draft" | "in_review" | "signed" | "expired" | "terminated";
export type MatterType = "notice_received" | "notice_sent" | "litigation" | "ip" | "regulatory" | "other";

export interface Contract {
  id: string;
  title: string;
  contract_type: string;
  counterparty: string | null;
  status: ContractStatus;
  start_date: string | null;
  end_date: string | null;
  renewal_notice_days: number | null;
  value: number | null;
  owner_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface LegalMatter {
  id: string;
  title: string;
  matter_type: MatterType;
  counterparty: string | null;
  status: "open" | "closed";
  opened_on: string;
  closed_on: string | null;
  next_date: string | null;
  next_action: string | null;
  description: string | null;
  created_at: string;
}
