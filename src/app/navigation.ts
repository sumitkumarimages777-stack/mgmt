import type { IconName } from "../components/ui";
import { MODULE_LABEL } from "../lib/labels";
import type { ModuleKey } from "../lib/types";

export interface NavItem {
  to: string;
  icon: IconName;
  label: string;
  /** Permission needed to see the item. */
  perm: string;
  /** Lowest level that shows the item (default "view"; "own" for self-service HR pages). */
  min?: "own" | "view";
  badge?: "overdueFilings" | "requestsToSend";
}

export interface NavSection {
  module: ModuleKey;
  label: string;
  items: NavItem[];
}

/** Left menu, one section per department. Legal and Company Meetings come in later phases. */
export const NAV_SECTIONS: NavSection[] = [
  {
    module: "ca",
    label: MODULE_LABEL.ca,
    items: [
      { to: "/ca/filings", icon: "calendar", label: "Filings", perm: "ca.filings", badge: "overdueFilings" },
      { to: "/ca/requests", icon: "inbox", label: "Document requests", perm: "ca.requests", badge: "requestsToSend" },
      { to: "/ca/records", icon: "file", label: "Records", perm: "ca.documents" },
    ],
  },
  {
    module: "hr",
    label: MODULE_LABEL.hr,
    items: [
      { to: "/hr/team", icon: "users", label: "Team members", perm: "hr.team", min: "own" },
      { to: "/hr/documents", icon: "file", label: "Contracts & documents", perm: "hr.documents" },
      { to: "/hr/equipment", icon: "laptop", label: "Equipment", perm: "hr.equipment" },
      { to: "/hr/esop", icon: "chart", label: "ESOPs", perm: "hr.esop" },
    ],
  },
];
