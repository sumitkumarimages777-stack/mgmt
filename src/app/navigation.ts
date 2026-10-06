import type { IconName } from "../components/ui";
import { MODULE_LABEL } from "../lib/labels";
import type { ModuleKey } from "../lib/types";

export interface NavItem {
  to: string;
  icon: IconName;
  label: string;
  /** Permission needed (at least "view") to see the item. */
  perm: string;
  badge?: "overdueFilings" | "requestsToSend";
}

export interface NavSection {
  module: ModuleKey;
  label: string;
  items: NavItem[];
}

/** Left menu, one section per department. HR and Legal are added in later phases. */
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
];
