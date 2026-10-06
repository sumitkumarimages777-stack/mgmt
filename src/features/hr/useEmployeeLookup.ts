import { useEmployees } from "../../api";
import { useAuth } from "../auth/AuthContext";

/** Employee id -> name, loaded only for people with some HR access. */
export function useEmployeeLookup() {
  const { permissions } = useAuth();
  const hasHr = [...permissions.keys()].some((k) => k.startsWith("hr."));
  const employees = useEmployees(hasHr);
  const byId = new Map((employees.data ?? []).map((e) => [e.id, e]));
  return {
    employees: employees.data ?? [],
    loading: employees.isLoading,
    employeeName: (id: string | null | undefined) => (id ? byId.get(id)?.full_name ?? "—" : "—"),
  };
}
