import { Tag } from "../../components/ui";
import { MODULE_LABEL } from "../../lib/labels";
import type { DocumentRequest } from "../../lib/types";

const SHORT = { ca: "CA", hr: "HR", legal: "Legal", company: "Company" } as const;

/** "HR → Legal", or just the handling department. */
export function RouteTag({ request: r, long }: { request: Pick<DocumentRequest, "module" | "from_module">; long?: boolean }) {
  const name = (m: keyof typeof SHORT) => (long ? MODULE_LABEL[m] : SHORT[m]);
  return <Tag>{r.from_module && r.from_module !== r.module ? `${name(r.from_module)} → ${name(r.module)}` : `To ${name(r.module)}`}</Tag>;
}
