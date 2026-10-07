import { useState } from "react";
import { useTdsRules } from "../../../api";
import { Empty, ErrorBox, Icon, Loading, Tag } from "../../../components/ui";
import { formatINR } from "../../../lib/format";
import { useAuth } from "../../auth/AuthContext";
import { EMPLOYMENT_TYPE_LABEL } from "../../hr/labels";
import { EligibleNow } from "./EligibleNow";
import { TdsRuleModal } from "./TdsRuleModal";

export function TdsRulesPage() {
  const { can } = useAuth();
  const rules = useTdsRules();
  const [open, setOpen] = useState<string | "new" | null>(null);
  const rows = rules.data ?? [];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>TDS rules</h1>
          <p>Who is eligible for TDS: team members whose salary is above a threshold, by section.</p>
        </div>
        {can("ca.tds_rules", "edit") && (
          <button className="btn btn-primary" onClick={() => setOpen("new")}><Icon name="plus" size={16} /> Add rule</button>
        )}
      </div>
      <div className="card">
        <ErrorBox error={rules.error} />
        {rules.isLoading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <Empty title="No TDS rules yet" />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Rule</th><th>Section</th><th>Applies to</th><th>Salary above</th><th>Default rate</th><th>Status</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="clickable" onClick={() => setOpen(r.id)}>
                    <td>
                      <div className="cell-title">{r.name}</div>
                      {r.notes && <div className="cell-sub">{r.notes}</div>}
                    </td>
                    <td><Tag>{r.section}</Tag></td>
                    <td>{r.employment_types?.length ? r.employment_types.map((t) => EMPLOYMENT_TYPE_LABEL[t]).join(", ") : "Everyone"}</td>
                    <td className="num nowrap">{formatINR(r.threshold)} {r.basis === "annual" ? "a year" : "a month"}</td>
                    <td className="num">{r.rate_percent === null ? "—" : `${r.rate_percent}%`}</td>
                    <td><span className={`badge ${r.is_active ? "badge-green" : "badge-gray"}`}>{r.is_active ? "Active" : "Off"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {can("ca.tds", "view") && rows.length > 0 && <EligibleNow rules={rows} />}
      {open && <TdsRuleModal rule={rows.find((r) => r.id === open) ?? null} onClose={() => setOpen(null)} />}
    </div>
  );
}
