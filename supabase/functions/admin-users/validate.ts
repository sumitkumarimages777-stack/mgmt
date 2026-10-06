export const ROLES = ["admin", "staff", "external"];
export const PERMISSIONS = ["view", "edit"];

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
