import type { ContractStatus, MatterType } from "../../lib/types";

export const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  signed: "Signed",
  expired: "Expired",
  terminated: "Terminated",
};

export const CONTRACT_TYPES = [
  "Client agreement",
  "Vendor / supplier agreement",
  "Employment contract",
  "Consultant agreement",
  "NDA",
  "Lease / rent agreement",
  "Partnership / MoU",
  "Licence",
  "Shareholders agreement",
  "Other",
];

export const MATTER_TYPE_LABEL: Record<MatterType, string> = {
  notice_received: "Notice received",
  notice_sent: "Notice sent",
  litigation: "Litigation / dispute",
  ip: "Trademark / IP",
  regulatory: "Regulatory",
  other: "Other",
};
