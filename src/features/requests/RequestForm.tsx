import { useState } from "react";
import { keys, saveRequest, useFilings, useWrite, type RequestInput } from "../../api";
import { ErrorBox, Modal, SelectField, TextField } from "../../components/ui";
import { formatDate } from "../../lib/dates";
import { MODULE_LABEL } from "../../lib/labels";
import type { DocumentRequest, ModuleKey } from "../../lib/types";
import { useAuth } from "../auth/AuthContext";
import { RequestRouteFields } from "./RequestRouteFields";

interface Props {
  request?: DocumentRequest;
  /** Department the request goes to, when raised from that department's page. */
  module?: ModuleKey;
  onClose: () => void;
}

export function RequestForm({ request, module, onClose }: Props) {
  const { can, permissions } = useAuth();
  const firstTarget = (Object.keys(MODULE_LABEL) as ModuleKey[]).find((m) => permissions.has(`${m}.requests`)) ?? "ca";
  const [form, setForm] = useState<RequestInput>({
    module: request?.module ?? module ?? firstTarget,
    from_module: request?.from_module ?? null,
    title: request?.title ?? "",
    description: request?.description ?? "",
    due_date: request?.due_date ?? null,
    filing_id: request?.filing_id ?? null,
  });
  const set = <K extends keyof RequestInput>(k: K, v: RequestInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const save = useWrite((input: RequestInput) => saveRequest(request?.id ?? null, input), [keys.requests]);
  const showFilings = form.module === "ca" && can("ca.filings");
  const filings = useFilings(showFilings);
  const openFilings = (filings.data ?? []).filter((f) => f.status !== "filed" || f.id === form.filing_id);
  const valid = !!form.title?.trim();

  const submit = () =>
    save.mutate(
      {
        ...form,
        title: form.title!.trim(),
        description: form.description?.trim() || null,
        due_date: form.due_date || null,
        filing_id: form.module === "ca" ? form.filing_id : null,
      },
      { onSuccess: onClose },
    );

  const footer = (
    <>
      <button className="btn" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" disabled={!valid || save.isPending} onClick={submit}>
        {save.isPending ? "Saving…" : request ? "Save" : "Send request"}
      </button>
    </>
  );

  return (
    <Modal title={request ? "Edit request" : "New request"} onClose={onClose} footer={footer}>
      <div className="form">
        <RequestRouteFields
          to={form.module!}
          from={form.from_module ?? null}
          lockTo={!!request || !!module}
          onChange={(to, from) => setForm((f) => ({ ...f, module: to, from_module: from }))}
        />
        <TextField label="What do you need?" value={form.title} onChange={(v) => set("title", v)} placeholder="e.g. Offer letter for new joiner" />
        <label className="field">
          <span>Details</span>
          <textarea className="textarea" value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="Names, dates, format, anything they should know…" />
        </label>
        <div className="form-row">
          <TextField label="Needed by" type="date" value={form.due_date} onChange={(v) => set("due_date", v || null)} />
          {showFilings && (
            <SelectField
              label="For filing (optional)"
              allowEmpty
              value={form.filing_id}
              onChange={(v) => set("filing_id", v || null)}
              options={openFilings.map((f) => ({ value: f.id, label: `${f.title}${f.period ? ` · ${f.period}` : ""} (due ${formatDate(f.due_date)})` }))}
            />
          )}
        </div>
        <ErrorBox error={save.error} />
      </div>
    </Modal>
  );
}
