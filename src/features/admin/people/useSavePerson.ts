import { adminUsers, keys, setUserRoles, updateProfile, useWrite } from "../../../api";
import type { Profile } from "../../../lib/types";

export interface PersonChanges {
  email: string;
  fullName: string;
  organization: string;
  roleIds: string[];
}

/** Save the edit-person form: login email (if changed), profile fields, then roles. */
export function useSavePerson(person: Profile, currentRoleIds: string[]) {
  return useWrite(async (c: PersonChanges) => {
    const email = c.email.trim().toLowerCase();
    if (email !== person.email) await adminUsers.setEmail(person.id, email);
    await updateProfile(person.id, { full_name: c.fullName.trim(), organization: c.organization.trim() || null });
    await setUserRoles(person.id, currentRoleIds, c.roleIds);
  }, [keys.profiles, keys.userRoles, keys.me]);
}

export function useToggleActive(person: Profile) {
  return useWrite(() => adminUsers.setActive(person.id, !person.is_active), [keys.profiles]);
}
