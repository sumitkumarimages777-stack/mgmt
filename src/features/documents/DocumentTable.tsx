import { useState } from "react";
import { useLookups } from "../../api";
import { ErrorBox } from "../../components/ui";
import type { SharedDocument } from "../../lib/types";
import { DocumentRow } from "./DocumentRow";

/** `showSource` adds a column saying whether a file came in for a request, a filing, or as a record. */
export function DocumentTable({ docs, showSource = true }: { docs: SharedDocument[]; showSource?: boolean }) {
  const lookups = useLookups();
  const [error, setError] = useState<unknown>(null);

  if (docs.length === 0) return <p className="faint small" style={{ margin: 0 }}>No documents.</p>;
  return (
    <>
      {!!error && <div style={{ marginBottom: 10 }}><ErrorBox error={error} /></div>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Document</th>
              {showSource && <th>For</th>}
              <th>Shared by</th>
              <th>Date</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <DocumentRow key={d.id} doc={d} showSource={showSource} lookups={lookups} onError={setError} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
