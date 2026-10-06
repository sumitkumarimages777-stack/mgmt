import { useState } from "react";
import { useLookups } from "../../api";
import { ErrorBox } from "../../components/ui";
import type { SharedDocument } from "../../lib/types";
import { DocumentRow } from "./DocumentRow";

export function DocumentTable({ docs, showArea = true }: { docs: SharedDocument[]; showArea?: boolean }) {
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
              {showArea && <th>Area</th>}
              <th>Shared by</th>
              <th>Date</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <DocumentRow key={d.id} doc={d} showArea={showArea} lookups={lookups} onError={setError} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
