// Shared plumbing for the data layer. Every query runs as the signed-in user,
// so Row Level Security in the database decides what comes back.
import { useMutation, useQueryClient } from "@tanstack/react-query";

export async function unwrap<T>(p: PromiseLike<{ data: T | null; error: unknown }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw error;
  return data as T;
}

export const keys = {
  me: ["me"] as const,
  profiles: ["profiles"] as const,
  permissions: ["permissions"] as const,
  roles: ["roles"] as const,
  userRoles: ["user_roles"] as const,
  filings: ["filings"] as const,
  requests: ["requests"] as const,
  documents: ["documents"] as const,
  activity: ["activity"] as const,
  employees: ["employees"] as const,
  assets: ["assets"] as const,
  assignments: ["asset_assignments"] as const,
  esop: ["esop_grants"] as const,
  contracts: ["contracts"] as const,
  matters: ["legal_matters"] as const,
  meetings: ["meetings"] as const,
  meetingActions: ["meeting_actions"] as const,
  meetingParts: (meetingId: string) => ["meeting_parts", meetingId] as const,
  payroll: (employeeId: string) => ["payroll", employeeId] as const,
  salaries: (employeeId: string) => ["salaries", employeeId] as const,
  comments: (kind: CommentParent, id: string) => ["comments", kind, id] as const,
};

export type CommentParent = "request" | "filing";

/**
 * Wrap a write so the listed caches refresh afterwards. Activity is always
 * refreshed because database triggers write to it.
 */
export function useWrite<TArgs, TResult = unknown>(
  fn: (args: TArgs) => Promise<TResult>,
  invalidate: ReadonlyArray<readonly unknown[]>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async () => {
      await Promise.all([...invalidate, keys.activity].map((k) => qc.invalidateQueries({ queryKey: k })));
    },
  });
}
