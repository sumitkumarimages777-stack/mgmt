import { deleteFilings, keys, useWrite } from "../../../api";
import { ErrorBox } from "../../../components/ui";
import type { RowSelection } from "./useRowSelection";

/** Shown above the filings table while rows are ticked: delete them all in one go. */
export function BulkDeleteBar({ selection }: { selection: RowSelection }) {
  const remove = useWrite((ids: string[]) => deleteFilings(ids), [keys.filings]);
  const count = selection.selected.length;
  if (count === 0) return null;

  const onDelete = () => {
    const label = count === 1 ? "this filing" : `these ${count} filings`;
    if (!confirm(`Delete ${label}? This can't be undone.`)) return;
    remove.mutate(selection.selected, { onSuccess: selection.clear });
  };

  return (
    <div className="bulk-bar">
      <strong>{count} selected</strong>
      <button className="btn btn-sm btn-danger" disabled={remove.isPending} onClick={onDelete}>
        {remove.isPending ? "Deleting…" : "Delete"}
      </button>
      <button className="btn btn-sm btn-ghost" disabled={remove.isPending} onClick={selection.clear}>
        Clear
      </button>
      {remove.error && <ErrorBox error={remove.error} />}
    </div>
  );
}
