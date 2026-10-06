import { useState } from "react";
import { fyStartYear, todayISO } from "../../../../lib/dates";
import { generateCompliance } from "../compliance";
import { COMPLIANCE_GROUP_LABEL, type ComplianceGroup } from "../compliancePresets";

const DEFAULT_PRESETS = ["gstr1", "gstr3b", "tds_payment", "tds_return", "advance_tax", "itr", "aoc4", "mgt7", "dir3kyc"];
export const GROUPS = Object.keys(COMPLIANCE_GROUP_LABEL) as ComplianceGroup[];

/** Form state for the calendar generator: year, chosen presets, and the rows to insert. */
export function useGeneratorState() {
  const currentFy = fyStartYear(todayISO());
  const [fy, setFy] = useState(currentFy);
  const [selected, setSelected] = useState(() => new Set(DEFAULT_PRESETS));

  const toggle = (key: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const rows = generateCompliance(fy, [...selected]).map((p) => ({
    category: p.category, title: p.title, form_code: p.form_code, period: p.period, due_date: p.due_date,
  }));

  return { currentFy, fy, setFy, selected, toggle, rows };
}
