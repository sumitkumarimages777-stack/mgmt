import type { AccessLevel } from "./types";

export const ACCESS_LEVELS: AccessLevel[] = ["own", "view", "edit", "manage"];

const RANK: Record<AccessLevel, number> = { own: 1, view: 2, edit: 3, manage: 4 };

/** Does `have` meet at least `need`? (undefined = no access) */
export function meets(have: AccessLevel | undefined, need: AccessLevel): boolean {
  return !!have && RANK[have] >= RANK[need];
}
