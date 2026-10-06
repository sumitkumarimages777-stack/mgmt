// Turns the compliance presets into dated filings for one financial year.

import { toISO } from "../../../lib/dates";
import { COMPLIANCE_PRESETS, type CompliancePreset, type GeneratedFiling } from "./compliancePresets";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** yyyy-mm-dd for a (year, 0-based month, day). */
function d(year: number, month: number, day: number): string {
  return toISO(new Date(year, month, day));
}

/** The 12 months of FY starting April `fy` as [year, monthIndex]. */
function fyMonths(fy: number): Array<[number, number]> {
  return Array.from({ length: 12 }, (_, i) => {
    const m = (3 + i) % 12;
    return [m >= 3 ? fy : fy + 1, m];
  });
}

function monthly(fy: number, day: number, preset: CompliancePreset, override?: (y: number, m: number) => string | null) {
  return fyMonths(fy).map(([y, m]) => {
    const custom = override?.(y, m);
    const due = custom ?? d(y, m + 1, day); // Date() rolls Dec+1 into Jan of next year
    return item(preset, `${MONTHS[m]} ${y}`, due);
  });
}

function item(p: CompliancePreset, period: string, due_date: string): GeneratedFiling {
  return { presetKey: p.key, group: p.group, category: p.category, title: p.title, form_code: p.formCode, period, due_date };
}

function fyTag(fy: number): string {
  return `FY ${fy}-${String((fy + 1) % 100).padStart(2, "0")}`;
}

/** All filings for the given FY (April `fy` – March `fy+1`) for the chosen presets. */
export function generateCompliance(fy: number, presetKeys: string[]): GeneratedFiling[] {
  const out: GeneratedFiling[] = [];
  const next = fy + 1;
  const tag = fyTag(fy);

  for (const key of presetKeys) {
    const p = COMPLIANCE_PRESETS.find((x) => x.key === key);
    if (!p) continue;
    switch (key) {
      case "gstr1":
        out.push(...monthly(fy, 11, p));
        break;
      case "gstr3b":
        out.push(...monthly(fy, 20, p));
        break;
      case "tds_payment":
        // March deduction is due 30 April instead of 7 April.
        out.push(...monthly(fy, 7, p, (_y, m) => (m === 2 ? d(next, 3, 30) : null)));
        break;
      case "pf":
      case "esi":
        out.push(...monthly(fy, 15, p));
        break;
      case "tds_return":
        out.push(
          item(p, `Q1 ${tag}`, d(fy, 6, 31)),
          item(p, `Q2 ${tag}`, d(fy, 9, 31)),
          item(p, `Q3 ${tag}`, d(next, 0, 31)),
          item(p, `Q4 ${tag}`, d(next, 4, 31)),
        );
        break;
      case "advance_tax":
        out.push(
          item(p, `1st instalment ${tag}`, d(fy, 5, 15)),
          item(p, `2nd instalment ${tag}`, d(fy, 8, 15)),
          item(p, `3rd instalment ${tag}`, d(fy, 11, 15)),
          item(p, `4th instalment ${tag}`, d(next, 2, 15)),
        );
        break;
      case "msme1":
        out.push(
          item(p, `Apr–Sep ${fy}`, d(fy, 9, 31)),
          item(p, `Oct ${fy}–Mar ${next}`, d(next, 3, 30)),
        );
        break;
      case "dir3kyc":
        // Filed during the FY itself, for the directors in office.
        out.push(item(p, tag, d(fy, 8, 30)));
        break;
      // Annual returns *for* this FY fall due in the following FY.
      case "dpt3":
        out.push(item(p, tag, d(next, 5, 30)));
        break;
      case "tax_audit":
        out.push(item(p, tag, d(next, 8, 30)));
        break;
      case "itr":
        out.push(item(p, tag, d(next, 9, 31)));
        break;
      case "aoc4":
        out.push(item(p, tag, d(next, 9, 30)));
        break;
      case "mgt7":
        out.push(item(p, tag, d(next, 10, 29)));
        break;
      case "gstr9":
        out.push(item(p, tag, d(next, 11, 31)));
        break;
    }
  }
  return out.sort((a, b) => a.due_date.localeCompare(b.due_date));
}
