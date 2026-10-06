export function checkEmail(email: unknown): string | null {
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "A valid email is required";
  return null;
}

export function checkPassword(password: unknown): string | null {
  if (typeof password !== "string" || password.length < 8) return "Password must be at least 8 characters";
  return null;
}

export function checkCredentials(email: unknown, password: unknown): string | null {
  return checkEmail(email) ?? checkPassword(password);
}

/** A list of role ids (uuids), or null if malformed. */
export function parseRoleIds(value: unknown): string[] | null {
  const list = value === undefined ? [] : value;
  if (!Array.isArray(list)) return null;
  const uuid = /^[0-9a-f-]{36}$/i;
  return list.every((id) => typeof id === "string" && uuid.test(id)) ? list : null;
}
