import { addComment, deleteRequest, keys, saveRequest, useWrite } from "../../../api";
import type { RequestStatus } from "../../../lib/types";

/** Status changes (optionally with an explanatory comment) and delete for one request. */
export function useRequestActions(requestId: string) {
  const setStatus = useWrite(
    async ({ status, note }: { status: RequestStatus; note?: string }) => {
      if (note) await addComment("request", requestId, note);
      return saveRequest(requestId, { status });
    },
    [keys.requests, keys.comments("request", requestId)],
  );
  const remove = useWrite(() => deleteRequest(requestId), [keys.requests]);
  return { setStatus, remove };
}
