import { useState } from "react";
import { insertFilingsSkippingExisting, keys, useWrite } from "../../../api";
import { ErrorBox, Modal } from "../../../components/ui";
import { fyLabel } from "../../../lib/dates";
import { PresetGroupCard } from "./PresetGroupCard";
import { GROUPS, useGeneratorState } from "./useGeneratorState";

export function GenerateCalendarModal({ onClose }: { onClose: () => void }) {
  const s = useGeneratorState();
  const [result, setResult] = useState<string | null>(null);
  const run = useWrite(() => insertFilingsSkippingExisting(s.rows), [keys.filings]);

  const submit = () =>
    run.mutate(undefined, {
      onSuccess: (added) =>
        setResult(`${added} filing${added === 1 ? "" : "s"} added. ${s.rows.length - added} already existed and were skipped.`),
    });

  const footer = result ? (
    <button className="btn btn-primary" onClick={onClose}>Done</button>
  ) : (
    <>
      <button className="btn" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" disabled={s.rows.length === 0 || s.missingArea || run.isPending} onClick={submit}>
        {run.isPending ? "Adding…" : `Add ${s.rows.length} filings`}
      </button>
    </>
  );

  return (
    <Modal wide title="Generate compliance calendar" onClose={onClose} footer={footer}>
      {result ? (
        <div className="alert alert-ok">{result}</div>
      ) : (
        <div className="form">
          <p className="muted" style={{ margin: 0 }}>
            Creates one entry per period with the regular statutory due date. Running it again is safe — existing
            entries are skipped. When the government extends a deadline, just edit that filing's due date.
          </p>
          <label className="field" style={{ maxWidth: 240 }}>
            <span>Financial year</span>
            <select className="select" value={s.fy} onChange={(e) => s.setFy(Number(e.target.value))}>
              {[s.currentFy - 1, s.currentFy, s.currentFy + 1].map((y) => <option key={y} value={y}>{fyLabel(y)}</option>)}
            </select>
          </label>
          {GROUPS.map((g) => (
            <PresetGroupCard
              key={g}
              group={g}
              areas={s.areas}
              areaId={s.groupArea[g]}
              onAreaChange={(id) => s.setArea(g, id)}
              selected={s.selected}
              onToggle={s.toggle}
            />
          ))}
          <ErrorBox error={run.error} />
        </div>
      )}
    </Modal>
  );
}
