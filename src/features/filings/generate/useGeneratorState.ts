import { useState } from "react";
import { useLookups } from "../../../api";
import { fyStartYear, todayISO } from "../../../lib/dates";
import { generateCompliance } from "../compliance";
import { COMPLIANCE_GROUP_AREA_HINT, COMPLIANCE_GROUP_LABEL, type ComplianceGroup } from "../compliancePresets";

const DEFAULT_PRESETS = ["gstr1", "gstr3b", "tds_payment", "tds_return", "advance_tax", "itr", "aoc4", "mgt7", "dir3kyc"];
export const GROUPS = Object.keys(COMPLIANCE_GROUP_LABEL) as ComplianceGroup[];

/** Form state for the calendar generator: year, chosen presets, target area per group, and the preview. */
export function useGeneratorState() {
  const { areas } = useLookups();
  const currentFy = fyStartYear(todayISO());
  const [fy, setFy] = useState(currentFy);
  const [selected, setSelected] = useState(() => new Set(DEFAULT_PRESETS));
  const guess = (g: ComplianceGroup) =>
    areas.find((a) => COMPLIANCE_GROUP_AREA_HINT[g].test(a.name))?.id ?? areas[0]?.id ?? "";
  const [groupArea, setGroupArea] = useState(() =>
    Object.fromEntries(GROUPS.map((g) => [g, guess(g)])) as Record<ComplianceGroup, string>,
  );

  const toggle = (key: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const preview = generateCompliance(fy, [...selected]);
  const missingArea = GROUPS.some((g) => preview.some((p) => p.group === g) && !groupArea[g]);
  const rows = preview.map((p) => ({
    area_id: groupArea[p.group], title: p.title, form_code: p.form_code, period: p.period, due_date: p.due_date,
  }));

  return {
    areas, currentFy, fy, setFy, selected, toggle, groupArea,
    setArea: (g: ComplianceGroup, id: string) => setGroupArea((s) => ({ ...s, [g]: id })),
    rows, missingArea,
  };
}
