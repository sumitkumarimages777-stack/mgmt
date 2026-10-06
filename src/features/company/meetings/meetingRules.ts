// ROC deadlines that follow from meetings (Companies Act, 2013).
import { addDays } from "../../../lib/dates";

/** AOC-4 is due 30 days and MGT-7 60 days after the AGM. */
export function rocDatesFromAgm(agmDate: string): { aoc4: string; mgt7: string } {
  return { aoc4: addDays(agmDate, 30), mgt7: addDays(agmDate, 60) };
}

/** MGT-14 (filing of certain resolutions) is due 30 days after the resolution is passed. */
export function mgt14Due(passedOn: string): string {
  return addDays(passedOn, 30);
}

/** Filings the generator creates for these, keyed so an AGM can update their due dates. */
export const AGM_FILINGS = [
  { key: "aoc4" as const, title: "Financial statements", form_code: "AOC-4" },
  { key: "mgt7" as const, title: "Annual return", form_code: "MGT-7 / 7A" },
];
