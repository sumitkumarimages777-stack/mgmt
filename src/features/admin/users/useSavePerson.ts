import { adminUsers, keys, replaceAreaAccess, updateProfile, useWrite, type AccessMap } from "../../../api";
import type { Area, Profile, UserRole } from "../../../lib/types";

export interface PersonChanges {
  email: string;
  fullName: string;
  organization: string;
  role: UserRole;
  access: AccessMap;
}

/** Save the edit-person form: login email (if changed), profile fields, then area access. */
export function useSavePerson(person: Profile, areas: Area[]) {
  return useWrite(async (c: PersonChanges) => {
    const email = c.email.trim().toLowerCase();
    if (email !== person.email) await adminUsers.setEmail(person.id, email);
    await updateProfile(person.id, { full_name: c.fullName.trim(), organization: c.organization.trim() || null, role: c.role });
    await replaceAreaAccess(person.id, areas.map((a) => a.id), c.access);
  }, [keys.profiles, keys.members, keys.me]);
}

export function useToggleActive(person: Profile) {
  return useWrite(() => adminUsers.setActive(person.id, !person.is_active), [keys.profiles]);
}
