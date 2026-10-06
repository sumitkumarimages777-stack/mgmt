import { useState } from "react";
import { keys, saveFiling, useWrite, type FilingInput } from "../../../../api";
import { ErrorBox } from "../../../../components/ui";
import { FILING_STATUS_LABEL } from "../../../../lib/labels";
import type { Filing, FilingStatus } from "../../../../lib/types";
import { MarkFiledForm } from "./MarkFiledForm";

const QUICK_STATUSES: FilingStatus[] = ["pending", "in_progress", "not_applicable"];

/** Status buttons + "Mark as filed" for people who can edit filings. */
export function FilingStatusActions({ filing }: { filing: Filing }) {
  const [markingFiled, setMarkingFiled] = useState(false);
  const save = useWrite((input: FilingInput) => saveFiling(filing.id, input), [keys.filings]);
  const setStatus = (status: FilingStatus) => save.mutate({ status, filed_on: null });

  if (filing.status === "filed") {
    return (
      <div style={{ marginTop: 14 }}>
        <button className="btn btn-sm" disabled={save.isPending} onClick={() => setStatus("pending")}>
          Re-open (mark not filed)
        </button>
        <ErrorBox error={save.error} />
      </div>
    );
  }

  return (
    <>
      <div className="actions" style={{ marginTop: 14 }}>
        <span className="small muted">Set status:</span>
        {QUICK_STATUSES.map((s) => (
          <button key={s} className="btn btn-sm" disabled={filing.status === s || save.isPending} onClick={() => setStatus(s)}>
            {FILING_STATUS_LABEL[s]}
          </button>
        ))}
        {!markingFiled && (
          <button className="btn btn-sm btn-primary" onClick={() => setMarkingFiled(true)}>Mark as filed</button>
        )}
      </div>
      {markingFiled && (
        <MarkFiledForm
          busy={save.isPending}
          onCancel={() => setMarkingFiled(false)}
          onSave={(filed_on, ack_number) =>
            save.mutate({ status: "filed", filed_on, ack_number }, { onSuccess: () => setMarkingFiled(false) })
          }
        />
      )}
      <ErrorBox error={save.error} />
    </>
  );
}
